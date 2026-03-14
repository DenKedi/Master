"use client";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import FlippableCard from "@/components/ui/FlippableCard";
import { RARITY_COLORS } from "@/lib/rarityColors";

interface CardInfo {
  cardId: string;
  name: string;
  type: string;
  characterType?: string;
  rarity: string;
  imageUrl: string;
  description: string;
  attack: number;
  defense: number;
  price?: number;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  setId?: string;
  crop: { x: number; y: number; width: number; height: number } | null;
}



// Card art crop aspect ratio: matches art area 512×680 (~3:4 portrait)
const CROP_ASPECT = 512 / 680;
// Landscape art crop aspect ratio: matches landscape art area 880×392
const CROP_ASPECT_LANDSCAPE = 880 / 392;

export default function AdminCardsPage() {
  const [cards, setCards] = useState<CardInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CardInfo | null>(null);
  const [previewCard, setPreviewCard] = useState<CardInfo | null>(null);
  const [editCard, setEditCard] = useState<CardInfo | null>(null);
  const [message, setMessage] = useState("");
  const [cacheBust, setCacheBust] = useState(() => Date.now());

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editRarity, setEditRarity] = useState("");
  const [editAttack, setEditAttack] = useState(0);
  const [editDefense, setEditDefense] = useState(0);
  const [editPrice, setEditPrice] = useState<number | "">("");
  const [editTags, setEditTags] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editIsFeatured, setEditIsFeatured] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  // Image upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload-crop modal state
  const [uploadCropOpen, setUploadCropOpen] = useState(false);
  const [uploadCropPos, setUploadCropPos] = useState({ x: 0, y: 0 });
  const [uploadZoom, setUploadZoom] = useState(1);
  const [uploadCroppedAreaPixels, setUploadCroppedAreaPixels] = useState<Area | null>(null);
  const [uploadSaving, setUploadSaving] = useState(false);

  // Standalone crop editor state
  const [cropPos, setCropPos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  // Filter & sort state
  const [filterType, setFilterType] = useState<string>("all");
  const [filterRarity, setFilterRarity] = useState<string>("all");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("active");
  const [filterCrop, setFilterCrop] = useState<"all" | "cropped" | "uncropped">("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "type" | "rarity">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  async function fetchCards() {
    const [cardsRes, cropRes] = await Promise.all([
      fetch("/api/admin/cards").then((r) => r.json()),
      fetch("/api/admin/cards/crop").then((r) => r.json()),
    ]);
    const allCards = cardsRes.data ?? [];
    const cropData = cropRes.data ?? [];
    const cropMap = new Map(cropData.map((c: any) => [c.cardId ?? c.name, c.crop]));

    const merged: CardInfo[] = allCards.map((c: any) => ({
      cardId: c.cardId ?? "",
      name: c.name ?? "",
      type: c.type ?? "",
      characterType: c.characterType,
      rarity: c.rarity ?? "normal",
      imageUrl: c.imageUrl ?? "",
      description: c.description ?? "",
      attack: c.attack ?? 0,
      defense: c.defense ?? 0,
      price: c.price,
      tags: Array.isArray(c.tags) ? c.tags : [],
      isActive: c.isActive ?? true,
      isFeatured: c.isFeatured ?? false,

      setId: c.setId,
      crop: cropMap.get(c.cardId) ?? cropMap.get(c.name) ?? null,
    }));

    setCards(merged);
    setLoading(false);
  }

  useEffect(() => {
    fetchCards();
  }, []);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const onUploadCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setUploadCroppedAreaPixels(croppedPixels);
  }, []);

  function openCropEditor(card: CardInfo) {
    setSelected(card);
    setCropPos({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setMessage("");
  }

  function closeCropEditor() {
    setSelected(null);
    setCroppedAreaPixels(null);
    setMessage("");
  }

  async function saveCrop() {
    if (!selected || !croppedAreaPixels) return;
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/admin/cards/crop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cardId: selected.cardId,
        crop: {
          x: Math.round(croppedAreaPixels.x),
          y: Math.round(croppedAreaPixels.y),
          width: Math.round(croppedAreaPixels.width),
          height: Math.round(croppedAreaPixels.height),
        },
      }),
    });

    const data = await res.json();
    setSaving(false);
    if (data.success) {
      setCacheBust(Date.now());
      fetchCards();
      closeCropEditor();
    } else {
      setMessage(data.error ?? "Error saving crop.");
    }
  }

  async function resetCrop() {
    if (!selected) return;
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/admin/cards/crop", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: selected.cardId }),
    });

    const data = await res.json();
    setSaving(false);
    if (data.success) {
      setMessage("Crop reset to default.");
      setCropPos({ x: 0, y: 0 });
      setZoom(1);
      setCacheBust(Date.now());
      fetchCards();
    } else {
      setMessage(data.error ?? "Error resetting crop.");
    }
  }

  // Only show cards that have local images (something to crop)
  const croppableCards = cards.filter(
    (c) => c.imageUrl && !c.imageUrl.startsWith("http"),
  );
  const noCropCards = cards.filter(
    (c) => !c.imageUrl || c.imageUrl.startsWith("http"),
  );

  function openEditModal(card: CardInfo) {
    setEditCard(card);
    setEditName(card.name);
    setEditDescription(card.description);
    setEditRarity(card.rarity);
    setEditAttack(card.attack);
    setEditDefense(card.defense);
    setEditPrice(card.price !== undefined ? card.price : "");
    setEditTags(card.tags.join(", "));
    setEditIsActive(card.isActive);
    setEditIsFeatured(card.isFeatured);
    setUploadFile(null);
    setUploadPreview(null);
    setUploadCropOpen(false);
    setMessage("");
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setUploadFile(file);
    setUploadPreview(preview);
    setUploadCropPos({ x: 0, y: 0 });
    setUploadZoom(1);
    setUploadCroppedAreaPixels(null);
    setUploadCropOpen(true);
  }

  function closeUploadCropModal() {
    setUploadCropOpen(false);
    setUploadFile(null);
    setUploadPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function uploadWithCrop() {
    if (!editCard || !uploadFile || !uploadCroppedAreaPixels) return;
    setUploadSaving(true);
    setMessage("");

    // 1. Upload image to R2
    const form = new FormData();
    form.append("cardId", editCard.cardId);
    form.append("file", uploadFile);
    const uploadRes = await fetch("/api/admin/cards/image", { method: "POST", body: form });
    const uploadData = await uploadRes.json();

    if (!uploadData.success) {
      setUploadSaving(false);
      setMessage(uploadData.error ?? "Upload failed.");
      return;
    }

    // 2. Save the crop
    const cropRes = await fetch("/api/admin/cards/crop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cardId: editCard.cardId,
        crop: {
          x: Math.round(uploadCroppedAreaPixels.x),
          y: Math.round(uploadCroppedAreaPixels.y),
          width: Math.round(uploadCroppedAreaPixels.width),
          height: Math.round(uploadCroppedAreaPixels.height),
        },
      }),
    });
    const cropData = await cropRes.json();

    setUploadSaving(false);
    setCacheBust(Date.now());
    await fetchCards();
    setEditCard((prev) => prev ? { ...prev, imageUrl: uploadData.data.imageUrl } : prev);
    closeUploadCropModal();

    if (!cropData.success) {
      setMessage("Uploaded to R2, but crop save failed: " + (cropData.error ?? "unknown error"));
    } else {
      setMessage("Image uploaded and crop saved.");
    }
  }

  async function saveEdit() {
    if (!editCard) return;
    setEditSaving(true);
    setMessage("");

    const tagsArray = editTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const res = await fetch("/api/admin/cards", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cardId: editCard.cardId,
        name: editName,
        description: editDescription,
        rarity: editRarity,
        attack: editAttack,
        defense: editDefense,
        ...(editPrice !== "" && { price: Number(editPrice) }),
        tags: tagsArray,
        isActive: editIsActive,
        isFeatured: editIsFeatured,
      }),
    });
    const data = await res.json();
    setEditSaving(false);
    if (data.success) {
      setCacheBust(Date.now());
      await fetchCards();
      setEditCard(null);
    } else {
      setMessage(data.error ?? "Error saving card.");
    }
  }

  // Unique types/rarities for filter dropdowns
  const uniqueTypes = useMemo(
    () => [...new Set(cards.map((c) => c.type))].sort(),
    [cards],
  );
  const uniqueRarities = useMemo(
    () => [...new Set(cards.map((c) => c.rarity))].sort(),
    [cards],
  );

  // Filtered + sorted cards
  const filteredCards = useMemo(() => {
    const RARITY_ORDER: Record<string, number> = { normal: 0, nice: 1, special: 2, uiiiii: 3, unknown: 4 };
    let list = cards.filter((c) => {
      if (filterType !== "all" && c.type !== filterType) return false;
      if (filterRarity !== "all" && c.rarity !== filterRarity) return false;
      if (filterActive === "active" && !c.isActive) return false;
      if (filterActive === "inactive" && c.isActive) return false;
      if (filterCrop === "cropped" && !c.crop) return false;
      if (filterCrop === "uncropped" && c.crop) return false;
      if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.cardId.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") cmp = a.name.localeCompare(b.name);
      else if (sortBy === "type") cmp = a.type.localeCompare(b.type) || a.name.localeCompare(b.name);
      else if (sortBy === "rarity") cmp = (RARITY_ORDER[a.rarity] ?? 99) - (RARITY_ORDER[b.rarity] ?? 99) || a.name.localeCompare(b.name);
      return sortDir === "desc" ? -cmp : cmp;
    });
    return list;
  }, [cards, filterType, filterRarity, filterActive, filterCrop, search, sortBy, sortDir]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Card Management</h1>
      <p className="text-gray-400 mb-8">
        Manage card metadata, upload artwork to R2, and crop images.
      </p>

      {loading ? (
        <div className="text-gray-500">Loading cards...</div>
      ) : (
        <>
          {/* Filter & Sort Toolbar */}
          <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-gray-900/60 border border-white/10 rounded-xl">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or ID…"
              className="px-3 py-1.5 text-sm bg-gray-800 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none"
              style={{ width: 200 }}
            />
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-1.5 text-sm bg-gray-800 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none">
              <option value="all">All Types</option>
              {uniqueTypes.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
            <select value={filterRarity} onChange={(e) => setFilterRarity(e.target.value)} className="px-3 py-1.5 text-sm bg-gray-800 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none">
              <option value="all">All Rarities</option>
              {uniqueRarities.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
            <select value={filterActive} onChange={(e) => setFilterActive(e.target.value as any)} className="px-3 py-1.5 text-sm bg-gray-800 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none">
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="all">All Cards</option>
            </select>
            <select value={filterCrop} onChange={(e) => setFilterCrop(e.target.value as "all" | "cropped" | "uncropped")} className="px-3 py-1.5 text-sm bg-gray-800 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none">
              <option value="all">All Crops</option>
              <option value="cropped">Cropped</option>
              <option value="uncropped">Uncropped</option>
            </select>
            <div className="h-5 w-px bg-white/10" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "name" | "type" | "rarity")} className="px-3 py-1.5 text-sm bg-gray-800 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none">
              <option value="name">Sort: Name</option>
              <option value="type">Sort: Type</option>
              <option value="rarity">Sort: Rarity</option>
            </select>
            <button onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))} className="px-3 py-1.5 text-sm bg-gray-800 border border-white/10 rounded-lg text-white hover:bg-gray-700 transition">
              {sortDir === "asc" ? "↑ Asc" : "↓ Desc"}
            </button>
            <div className="h-5 w-px bg-white/10" />
            <button
              onClick={() => setCacheBust(Date.now())}
              className="px-3 py-1.5 text-sm bg-gray-800 border border-white/10 rounded-lg text-indigo-300 hover:bg-indigo-600/30 hover:border-indigo-500/50 transition"
              title="Force re-render all card images in browser"
            >
              🔄 Refresh Renders
            </button>
            <button
              onClick={async () => {
                if (!confirm("Pre-render ALL active cards and upload to R2? This may take a few minutes.")) return;
                try {
                  const res = await fetch("/api/admin/cards/render-all", { method: "POST" });
                  const data = await res.json();
                  if (data.data) {
                    alert(`Pre-rendered ${data.data.success} cards.${data.data.failed.length ? `\nFailed: ${data.data.failed.join(", ")}` : ""}`);
                    setCacheBust(Date.now());
                  } else {
                    alert("Error: " + (data.error || "Unknown error"));
                  }
                } catch (e) {
                  alert("Pre-render failed: " + (e instanceof Error ? e.message : e));
                }
              }}
              className="px-3 py-1.5 text-sm bg-gray-800 border border-white/10 rounded-lg text-amber-300 hover:bg-amber-600/30 hover:border-amber-500/50 transition"
              title="Pre-render all cards and upload PNGs to R2 (one-time migration)"
            >
              ⚡ Pre-render All to R2
            </button>
            <span className="ml-auto text-xs text-gray-500">{filteredCards.length} / {cards.length} cards</span>
          </div>

          {/* Cards Grid */}
          <h2 className="text-xl font-semibold mb-4">Cards ({filteredCards.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-10">
            {filteredCards.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">No cards match your filters</div>
            ) : filteredCards.map((card) => (
              <div key={card.cardId} className="group relative bg-gray-900 border border-white/10 rounded-xl overflow-hidden hover:border-indigo-500/50 transition-all duration-200">
                {/* Preview */}
                <div className="bg-gray-800 relative overflow-hidden flex flex-col justify-center p-2 cursor-pointer" onClick={() => setPreviewCard(card)}>
                  {card.type === "destination" ? (
                    <div className="relative w-full max-w-[200px] mx-auto overflow-hidden rounded-lg" style={{ aspectRatio: "560/880" }}>
                      <img
                        alt={card.name}
                        src={`/api/cards/render/${encodeURIComponent(card.cardId)}?v=${cacheBust}`}
                        className="absolute top-1/2 left-1/2 drop-shadow-md transition-transform hover:scale-105"
                        style={{ width: "157.14%", height: "auto", transform: "translate(-50%, -50%) rotate(90deg)", maxWidth: "none" }}
                      />
                    </div>
                  ) : (
                    <img
                      alt={card.name}
                      src={`/api/cards/render/${encodeURIComponent(card.cardId)}?v=${cacheBust}`}
                      className="w-full max-w-[200px] mx-auto rounded-lg object-contain shadow-md transition-transform hover:scale-105"
                    />
                  )}
                  {card.crop && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 z-10 rounded-full bg-green-900/60 text-green-300 text-[10px] font-bold uppercase tracking-wider pointer-events-none">Cropped</div>
                  )}
                  {!card.isActive && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 z-10 rounded-full bg-red-900/60 text-red-300 text-[10px] font-bold uppercase tracking-wider pointer-events-none">Inactive</div>
                  )}
                </div>
                {/* Info */}
                <div className="px-3 pb-3">
                  <div className="text-sm font-semibold text-white mt-2 mb-0.5 truncate">{card.name}</div>
                  <div className="text-[10px] text-gray-500 mb-1 truncate">{card.cardId}</div>
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: RARITY_COLORS[card.rarity] ?? "#6b7280" }} />
                      <span className="capitalize">{card.rarity}</span>
                    </span>
                    <span className="capitalize px-1.5 py-0.5 bg-gray-800 rounded text-gray-300 border border-white/5">{card.type}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditModal(card)} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-purple-600/20 text-purple-300 hover:bg-purple-600 hover:text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors">
                      ✏️ Edit
                    </button>
                    {card.imageUrl && (
                      <button onClick={() => openCropEditor(card)} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors">
                        ✂️ Crop
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Upload & Crop Modal — appears when a new file is selected in the edit modal */}
      {uploadCropOpen && uploadPreview && editCard && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-3xl mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div>
                <h3 className="text-lg font-bold">Crop & Upload — {editCard.name}</h3>
                <p className="text-xs text-gray-500">Adjust the crop, then confirm to upload to R2 and save the crop.</p>
              </div>
              <button onClick={closeUploadCropModal} className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 transition">✕</button>
            </div>
            <div className="relative w-full" style={{ height: 450 }}>
              <Cropper
                image={uploadPreview}
                crop={uploadCropPos}
                zoom={uploadZoom}
                aspect={editCard.type === "destination" ? CROP_ASPECT_LANDSCAPE : CROP_ASPECT}
                onCropChange={setUploadCropPos}
                onZoomChange={setUploadZoom}
                onCropComplete={onUploadCropComplete}
                objectFit="contain"
              />
            </div>
            <div className="px-6 py-3 flex items-center gap-4">
              <span className="text-xs text-gray-500">Zoom</span>
              <input type="range" min={1} max={5} step={0.05} value={uploadZoom} onChange={(e) => setUploadZoom(Number(e.target.value))} className="flex-1 accent-blue-500" />
              <span className="text-xs text-gray-400 w-10 text-right">{uploadZoom.toFixed(1)}×</span>
            </div>
            <div className="px-6 py-4 border-t border-white/10 flex items-center gap-3">
              <button
                onClick={uploadWithCrop}
                disabled={uploadSaving || !uploadCroppedAreaPixels}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-sm transition disabled:opacity-50 flex items-center gap-2"
              >
                {uploadSaving ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Uploading…
                  </>
                ) : "Upload & Save Crop"}
              </button>
              <button onClick={closeUploadCropModal} disabled={uploadSaving} className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm transition ml-auto disabled:opacity-50">Cancel</button>
              {message && <span className="text-sm text-blue-300">{message}</span>}
            </div>
          </div>
        </div>
      )}

      {/* Crop Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-3xl mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div>
                <h3 className="text-lg font-bold">{selected.name}</h3>
                <p className="text-xs text-gray-500 capitalize">{selected.type} · {selected.rarity}</p>
              </div>
              <button onClick={closeCropEditor} className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 transition">✕</button>
            </div>
            <div className="relative w-full" style={{ height: 450 }}>
              <Cropper
                image={selected.imageUrl}
                crop={cropPos}
                zoom={zoom}
                aspect={selected.type === "destination" ? CROP_ASPECT_LANDSCAPE : CROP_ASPECT}
                onCropChange={setCropPos}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                objectFit="contain"
              />
            </div>
            <div className="px-6 py-3 flex items-center gap-4">
              <span className="text-xs text-gray-500">Zoom</span>
              <input type="range" min={1} max={5} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 accent-indigo-500" />
              <span className="text-xs text-gray-400 w-10 text-right">{zoom.toFixed(1)}×</span>
            </div>
            <div className="px-6 py-4 border-t border-white/10 flex items-center gap-3">
              <button onClick={saveCrop} disabled={saving || !croppedAreaPixels} className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm transition disabled:opacity-50">
                {saving ? "Saving..." : "Save Crop"}
              </button>
              {selected.crop && (
                <button onClick={resetCrop} disabled={saving} className="px-5 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-sm transition disabled:opacity-50">Reset to Default</button>
              )}
              <button onClick={closeCropEditor} className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm transition ml-auto">Cancel</button>
              {message && <span className="text-sm text-indigo-300">{message}</span>}
            </div>
          </div>
        </div>
      )}

      {/* Card Preview Modal */}
      {previewCard && typeof document !== "undefined" && document.getElementById("modal-portal") && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => setPreviewCard(null)}>
          <div className={`bg-gray-900 border border-white/10 rounded-2xl overflow-hidden my-auto w-full flex flex-col ${previewCard.type === "destination" ? "max-w-4xl" : "max-w-xl"}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-shrink-0 items-center justify-between p-4 border-b border-white/10">
              <div>
                <h3 className="text-xl font-bold">{previewCard.name}</h3>
                <p className="text-sm text-gray-500 capitalize">{previewCard.type} · {previewCard.rarity}</p>
              </div>
              <button onClick={() => setPreviewCard(null)} className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 transition text-xl">✕</button>
            </div>
            <div className="p-8 bg-gray-800/50 flex justify-center items-center flex-1 min-h-0 overflow-y-auto">
              <div style={{ width: "100%", maxWidth: previewCard.type === "destination" ? "750px" : "400px" }}>
                <FlippableCard
                  frontSrc={`/api/cards/render/${encodeURIComponent(previewCard.cardId)}?v=${cacheBust}`}
                  backSrc="/card-back.webp"
                  name={previewCard.name}
                  rarity={previewCard.rarity}
                  rarityColor={RARITY_COLORS[previewCard.rarity] ?? "#6b7280"}
                  cardType={previewCard.type as any}
                />
              </div>
            </div>
            <div className="px-8 py-5 border-t border-white/10 bg-gray-900/50 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="text-sm text-gray-400">
                <p className="font-semibold text-gray-300 mb-2">Card Details:</p>
                <ul className="space-y-1">
                  <li>• <strong>ID:</strong> {previewCard.cardId}</li>
                  <li>• <strong>Type:</strong> {previewCard.type.toUpperCase()}{previewCard.characterType ? ` (${previewCard.characterType})` : ""}</li>
                  <li>• <strong>Rarity:</strong> {previewCard.rarity.toUpperCase()}</li>
                  {previewCard.type !== "destination" && <li>• <strong>Stats:</strong> {previewCard.attack} ATK / {previewCard.defense} DEF</li>}
                  {previewCard.price !== undefined && <li>• <strong>Price:</strong> {previewCard.price}</li>}
                  <li>• <strong>Set:</strong> {previewCard.setId ?? "—"}</li>

                </ul>
              </div>
              <button onClick={() => setPreviewCard(null)} className="w-full sm:w-auto px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition text-lg">Close Preview</button>
            </div>
          </div>
        </div>,
        document.getElementById("modal-portal")!
      )}

      {/* Edit Card Modal */}
      {editCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl mx-4 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex flex-shrink-0 items-center justify-between p-4 border-b border-white/10">
              <div>
                <h3 className="text-lg font-bold">Edit Card</h3>
                <p className="text-xs text-gray-500">{editCard.cardId} · {editCard.type}{editCard.characterType ? ` · ${editCard.characterType}` : ""}{editCard.setId ? ` · set: ${editCard.setId}` : ""}</p>
              </div>
              <button onClick={() => setEditCard(null)} className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 transition">✕</button>
            </div>

            {/* Scrollable body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">

              {/* ── Image Upload ── */}
              <section>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Artwork (R2 Upload)</h4>
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-20 h-28 rounded-lg overflow-hidden bg-gray-800 border border-white/10 flex items-center justify-center">
                    {editCard.imageUrl ? (
                      <img src={editCard.imageUrl} alt={editCard.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-600 text-xs text-center p-1">No image</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="text-xs text-gray-500 break-all">{editCard.imageUrl || "—"}</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="cursor-pointer px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5">
                        Upload to R2
                        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="hidden" onChange={handleFileSelect} />
                      </label>

                    </div>
                  </div>
                </div>
              </section>

              <hr className="border-white/10" />

              {/* ── Admin Fields ── */}
              <section className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Card Data</h4>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Name</label>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-3 py-2 text-sm bg-gray-800 border border-white/10 rounded-lg text-white focus:border-purple-500 focus:outline-none" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Description</label>
                  <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} className="w-full px-3 py-2 text-sm bg-gray-800 border border-white/10 rounded-lg text-white focus:border-purple-500 focus:outline-none resize-none" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Rarity</label>
                  <select value={editRarity} onChange={(e) => setEditRarity(e.target.value)} className="w-full px-3 py-2 text-sm bg-gray-800 border border-white/10 rounded-lg text-white focus:border-purple-500 focus:outline-none">
                    <option value="normal">Normal</option>
                    <option value="nice">Nice</option>
                    <option value="special">Special</option>
                    <option value="uiiiii">Uiiiii</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>

                {editCard.type !== "destination" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Attack</label>
                      <input type="number" min={0} value={editAttack} onChange={(e) => setEditAttack(Number(e.target.value))} className="w-full px-3 py-2 text-sm bg-gray-800 border border-white/10 rounded-lg text-white focus:border-purple-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Defense</label>
                      <input type="number" min={0} value={editDefense} onChange={(e) => setEditDefense(Number(e.target.value))} className="w-full px-3 py-2 text-sm bg-gray-800 border border-white/10 rounded-lg text-white focus:border-purple-500 focus:outline-none" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Shop Price <span className="text-gray-600 font-normal normal-case">(leave blank = not for sale)</span></label>
                  <input type="number" min={0} value={editPrice} onChange={(e) => setEditPrice(e.target.value === "" ? "" : Number(e.target.value))} placeholder="—" className="w-full px-3 py-2 text-sm bg-gray-800 border border-white/10 rounded-lg text-white focus:border-purple-500 focus:outline-none" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Tags <span className="text-gray-600 font-normal normal-case">(comma-separated)</span></label>
                  <input value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="e.g. boss, starter, event" className="w-full px-3 py-2 text-sm bg-gray-800 border border-white/10 rounded-lg text-white focus:border-purple-500 focus:outline-none" />
                </div>

                <div className="flex flex-wrap gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editIsActive} onChange={(e) => setEditIsActive(e.target.checked)} className="accent-green-500 w-4 h-4" />
                    <span className="text-sm text-gray-300">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editIsFeatured} onChange={(e) => setEditIsFeatured(e.target.checked)} className="accent-yellow-500 w-4 h-4" />
                    <span className="text-sm text-gray-300">Featured</span>
                  </label>

                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/10 flex flex-shrink-0 items-center gap-3">
              <button onClick={saveEdit} disabled={editSaving} className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold text-sm transition disabled:opacity-50">
                {editSaving ? "Saving..." : "Save Changes"}
              </button>
              <button onClick={() => setEditCard(null)} className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm transition ml-auto">Cancel</button>
              {message && <span className="text-sm text-purple-300">{message}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
