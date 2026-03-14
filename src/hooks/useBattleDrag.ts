'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { BattleCard } from '@/lib/battle/types';

/* ═══════════════════════════════════════════════════════════════════════════
 *  useBattleDrag — Pointer-event based drag & drop for battle cards.
 *  Works on desktop (mouse) & mobile (touch).
 *
 *  All move/up/cancel handling runs via document-level listeners so
 *  the drag completes even if pointer capture is lost (disabled attr,
 *  browser quirk, React re-render swapping DOM node, etc.).
 *
 *  Usage:
 *    const drag = useBattleDrag({ onDrop });
 *    <div {...drag.draggableProps(card, canDrag)} />
 *    <div ref={drag.dropZoneRef("player-active", ["character","arsenal"])} />
 * ═══════════════════════════════════════════════════════════════════════════ */

export type DropZoneId = 'player-active' | 'field-destination';

export interface DragState {
  dragging: BattleCard | null;
  position: { x: number; y: number };
  overZone: DropZoneId | null;
}

interface UseBattleDragOptions {
  onDrop: (card: BattleCard, zone: DropZoneId) => void;
}

const DRAG_THRESHOLD = 8;

export function useBattleDrag({ onDrop }: UseBattleDragOptions) {
  const [dragState, setDragState] = useState<DragState>({
    dragging: null,
    position: { x: 0, y: 0 },
    overZone: null,
  });

  // Stable ref for onDrop — avoids recreating handlers when onDrop changes
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;

  // Refs for drag state (survives across events without re-render)
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const pendingCard = useRef<BattleCard | null>(null);
  const isDragging = useRef(false);
  const lastDragEnd = useRef(0);
  const activePointerId = useRef<number | null>(null);
  const lastOverZone = useRef<DropZoneId | null>(null);
  const dropZones = useRef<
    Map<DropZoneId, { el: HTMLElement; accepts: string[] }>
  >(new Map());

  // ── Drop zone registration ──
  const registerZone = useCallback(
    (id: DropZoneId, el: HTMLElement | null, accepts: string[]) => {
      if (el) {
        dropZones.current.set(id, { el, accepts });
      } else {
        dropZones.current.delete(id);
      }
    },
    [],
  );

  // ── Hit-test which drop zone the pointer is over ──
  const hitTest = useCallback(
    (x: number, y: number, card: BattleCard): DropZoneId | null => {
      for (const [id, zone] of dropZones.current) {
        if (!zone.accepts.includes(card.type)) continue;
        const rect = zone.el.getBoundingClientRect();
        if (
          x >= rect.left &&
          x <= rect.right &&
          y >= rect.top &&
          y <= rect.bottom
        ) {
          return id;
        }
      }
      return null;
    },
    [],
  );

  // ── Core drag handlers (all use refs — stable, never recreated) ──

  const resetDrag = useCallback((wasDrag: boolean) => {
    startPos.current = null;
    pendingCard.current = null;
    isDragging.current = false;
    activePointerId.current = null;
    lastOverZone.current = null;
    if (wasDrag) lastDragEnd.current = Date.now();
    setDragState({ dragging: null, position: { x: 0, y: 0 }, overZone: null });
  }, []);

  // Mutable ref for the document listeners so we can add/remove the exact
  // same function objects (required for removeEventListener).
  const docHandlers = useRef<{
    move: (e: PointerEvent) => void;
    up: (e: PointerEvent) => void;
    cancel: (e: PointerEvent) => void;
  } | null>(null);

  const removeDocListeners = useCallback(() => {
    if (docHandlers.current) {
      document.removeEventListener('pointermove', docHandlers.current.move);
      document.removeEventListener('pointerup', docHandlers.current.up);
      document.removeEventListener('pointercancel', docHandlers.current.cancel);
      docHandlers.current = null;
    }
  }, []);

  const addDocListeners = useCallback(() => {
    // Remove any leftovers first
    removeDocListeners();

    const handlers = {
      move(e: PointerEvent) {
        if (!startPos.current || !pendingCard.current) return;
        if (activePointerId.current !== null && e.pointerId !== activePointerId.current) return;

        const dx = e.clientX - startPos.current.x;
        const dy = e.clientY - startPos.current.y;

        if (!isDragging.current) {
          if (Math.abs(dx) + Math.abs(dy) < DRAG_THRESHOLD) return;
          isDragging.current = true;
        }

        const card = pendingCard.current;
        const zone = hitTest(e.clientX, e.clientY, card);
        lastOverZone.current = zone;

        setDragState({
          dragging: card,
          position: { x: e.clientX, y: e.clientY },
          overZone: zone,
        });
      },
      up(e: PointerEvent) {
        if (activePointerId.current !== null && e.pointerId !== activePointerId.current) return;

        if (isDragging.current && pendingCard.current) {
          const zone =
            hitTest(e.clientX, e.clientY, pendingCard.current) ??
            lastOverZone.current;
          if (zone) {
            onDropRef.current(pendingCard.current, zone);
          }
        }

        removeDocListeners();
        resetDrag(isDragging.current);
      },
      cancel(_e: PointerEvent) {
        removeDocListeners();
        resetDrag(isDragging.current);
      },
    };

    docHandlers.current = handlers;
    document.addEventListener('pointermove', handlers.move);
    document.addEventListener('pointerup', handlers.up);
    document.addEventListener('pointercancel', handlers.cancel);
  }, [hitTest, removeDocListeners, resetDrag]);

  // Ensure cleanup on unmount
  useEffect(() => () => removeDocListeners(), [removeDocListeners]);

  // ── Pointer handler for draggable cards (only pointerdown) ──
  const onPointerDown = useCallback(
    (e: React.PointerEvent, card: BattleCard) => {
      if (e.button !== 0) return;
      e.preventDefault();
      // Try pointer capture for best UX but don't depend on it
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch { /* ok — document listeners handle it */ }
      startPos.current = { x: e.clientX, y: e.clientY };
      pendingCard.current = card;
      isDragging.current = false;
      activePointerId.current = e.pointerId;
      lastOverZone.current = null;
      addDocListeners();
    },
    [addDocListeners],
  );

  // ── Build prop objects ──

  const draggableProps = useCallback(
    (card: BattleCard, enabled: boolean) =>
      enabled
        ? {
            onPointerDown: (e: React.PointerEvent) => onPointerDown(e, card),
            style: { touchAction: 'none' as const },
          }
        : { style: { touchAction: 'auto' as const } },
    [onPointerDown],
  );

  const dropZoneRef = useCallback(
    (id: DropZoneId, accepts: string[]) => (el: HTMLElement | null) => {
      registerZone(id, el, accepts);
    },
    [registerZone],
  );

  // Prevent context menu on long press (mobile)
  useEffect(() => {
    const handler = (e: Event) => {
      if (isDragging.current) e.preventDefault();
    };
    document.addEventListener('contextmenu', handler, { passive: false });
    return () => document.removeEventListener('contextmenu', handler);
  }, []);

  const wasDragged = useCallback(
    () => Date.now() - lastDragEnd.current < 300,
    [],
  );

  return {
    state: dragState,
    draggableProps,
    dropZoneRef,
    wasDragged,
  } as const;
}
