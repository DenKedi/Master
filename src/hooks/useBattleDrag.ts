'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { BattleCard } from '@/lib/battle/types';

/* ═══════════════════════════════════════════════════════════════════════════
 *  useBattleDrag — Pointer-event based drag & drop for battle cards.
 *  Works on desktop (mouse) & mobile (touch) via the Pointer Events API.
 *
 *  Usage:
 *    const drag = useBattleDrag({ onDrop });
 *    <div {...drag.draggableProps(card, canDrag)} />
 *    <div {...drag.dropZoneProps("player-active", ["character","arsenal"])} />
 *    {drag.ghostElement}
 * ═══════════════════════════════════════════════════════════════════════════ */

export type DropZoneId = 'player-active' | 'field-destination';

export interface DragState {
  /** The card currently being dragged (null if idle) */
  dragging: BattleCard | null;
  /** Current pointer position (for the ghost element) */
  position: { x: number; y: number };
  /** The drop zone the pointer is currently hovering */
  overZone: DropZoneId | null;
}

interface UseBattleDragOptions {
  /** Called when a card is successfully dropped onto a valid zone */
  onDrop: (card: BattleCard, zone: DropZoneId) => void;
}

/** Minimum distance (px) before a pointerdown becomes a drag */
const DRAG_THRESHOLD = 8;

export function useBattleDrag({ onDrop }: UseBattleDragOptions) {
  const [dragState, setDragState] = useState<DragState>({
    dragging: null,
    position: { x: 0, y: 0 },
    overZone: null,
  });

  // Refs that survive across pointer events without re-renders
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const pendingCard = useRef<BattleCard | null>(null);
  const isDragging = useRef(false);
  const lastDragEnd = useRef(0);
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

  // ── Pointer handlers for draggable cards ──
  const onPointerDown = useCallback(
    (e: React.PointerEvent, card: BattleCard) => {
      // Only primary button / single touch
      if (e.button !== 0) return;
      e.preventDefault();
      // Capture pointer so we receive move/up even outside the element
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      startPos.current = { x: e.clientX, y: e.clientY };
      pendingCard.current = card;
      isDragging.current = false;
    },
    [],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!startPos.current || !pendingCard.current) return;

      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;

      // Haven't crossed threshold yet
      if (!isDragging.current) {
        if (Math.abs(dx) + Math.abs(dy) < DRAG_THRESHOLD) return;
        isDragging.current = true;
      }

      const card = pendingCard.current;
      const zone = hitTest(e.clientX, e.clientY, card);

      setDragState({
        dragging: card,
        position: { x: e.clientX, y: e.clientY },
        overZone: zone,
      });
    },
    [hitTest],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);

      const wasDrag = isDragging.current;

      if (wasDrag && pendingCard.current) {
        const zone = hitTest(e.clientX, e.clientY, pendingCard.current);
        if (zone) {
          onDrop(pendingCard.current, zone);
        }
      }

      // Reset
      startPos.current = null;
      pendingCard.current = null;
      isDragging.current = false;
      if (wasDrag) lastDragEnd.current = Date.now();
      setDragState({
        dragging: null,
        position: { x: 0, y: 0 },
        overZone: null,
      });
    },
    [hitTest, onDrop],
  );

  const onPointerCancel = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    startPos.current = null;
    pendingCard.current = null;
    isDragging.current = false;
    setDragState({ dragging: null, position: { x: 0, y: 0 }, overZone: null });
  }, []);

  // ── Build prop objects ──

  /** Attach to each draggable card element */
  const draggableProps = useCallback(
    (card: BattleCard, enabled: boolean) =>
      enabled
        ? {
            onPointerDown: (e: React.PointerEvent) => onPointerDown(e, card),
            onPointerMove,
            onPointerUp,
            onPointerCancel,
            style: { touchAction: 'none' as const }, // prevent scroll while dragging
          }
        : { style: { touchAction: 'auto' as const } },
    [onPointerDown, onPointerMove, onPointerUp, onPointerCancel],
  );

  /** Attach to each drop zone's wrapper (via ref callback) */
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

  /** True if a drag just ended (within last 300ms). Use to suppress click-after-drag. */
  const wasDragged = useCallback(
    () => Date.now() - lastDragEnd.current < 300,
    [],
  );

  return {
    /** Current drag state */
    state: dragState,
    /** Props spread onto draggable card elements */
    draggableProps,
    /** Ref callback for drop zone registration */
    dropZoneRef,
    /** Returns true if a drag ended recently (to suppress inadvertent clicks) */
    wasDragged,
  } as const;
}
