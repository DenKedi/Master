"use client";
import { useEffect, useState } from "react";

const EMPTY_PACK = {
  name: "", description: "", price: 100, cardCount: 5,
  guaranteedRarity: "", imageUrl: "/packs/default.png",
  type: "standard", discount: 0, expiresAt: "", isFeatured: false,
};

const EMPTY_SLEEVE = {
  name: "", description: "", price: 50,
  imageUrl: "/sleeves/default.png", isFeatured: false,
};

const EMPTY_CARD = {
  price: 0, isFeatured: false, isActive: true
};

export default function AdminStorePage() {
  const [activeTab, setActiveTab] = useState<"packs" | "sleeves" | "cards">("packs");

  const [packs, setPacks] = useState<any[]>([]);
  const [sleeves, setSleeves] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]); // We add the cards state
  
  const [loading, setLoading] = useState(true);
  const [packForm, setPackForm] = useState({ ...EMPTY_PACK });
  const [sleeveForm, setSleeveForm] = useState({ ...EMPTY_SLEEVE });
  const [cardForm, setCardForm] = useState({ ...EMPTY_CARD });
  
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch("/api/admin/store"),
        fetch("/api/admin/store/sleeves"),
        fetch("/api/admin/store/cards")
      ]);
      const [d1, d2, d3] = await Promise.all([r1.json(), r2.json(), r3.json()]);
      setPacks(d1.data ?? []);
      setSleeves(d2.data ?? []);
      setCards(d3.data ?? []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  function updatePack(field: string, value: any) { setPackForm((p) => ({ ...p, [field]: value })); }
  function updateSleeve(field: string, value: any) { setSleeveForm((s) => ({ ...s, [field]: value })); }
  function updateCard(field: string, value: any) { setCardForm((c) => ({ ...c, [field]: value })); }

  function startEditPack(p: any) {
    setEditId(p._id);
    setPackForm({
      name: p.name, description: p.description, price: p.price,
      cardCount: p.cardCount, guaranteedRarity: p.guaranteedRarity ?? "",
      imageUrl: p.imageUrl, type: p.type, discount: p.discount ?? 0,
      expiresAt: p.expiresAt ? new Date(p.expiresAt).toISOString().slice(0, 10) : "",
      isFeatured: !!p.isFeatured
    });
  }

  function startEditSleeve(s: any) {
    setEditId(s._id);
    setSleeveForm({
      name: s.name, description: s.description, price: s.price,
      imageUrl: s.imageUrl, isFeatured: !!s.isFeatured
    });
  }

  function startEditCard(c: any) {
    setEditId(c._id);
    setCardForm({
      price: c.price || 0,
      isFeatured: !!c.isFeatured,
      isActive: c.isActive !== false
    });
  }

  function cancelEdit() {
    setEditId(null);
    setPackForm({ ...EMPTY_PACK });
    setSleeveForm({ ...EMPTY_SLEEVE });
    setCardForm({ ...EMPTY_CARD });
    setMessage("");
  }

  async function savePack() {
    setSaving(true); setMessage("");
    const body: any = { ...packForm, price: Number(packForm.price), cardCount: Number(packForm.cardCount), discount: Number(packForm.discount) };
    if (!body.expiresAt) delete body.expiresAt;
    if (!body.guaranteedRarity) delete body.guaranteedRarity;
    if (editId) body.packId = editId;

    const res = await fetch("/api/admin/store", {
      method: editId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) { setMessage("Pack saved!"); cancelEdit(); fetchAll(); }
    else setMessage(data.error ?? "Failed.");
  }

  async function saveSleeve() {
    setSaving(true); setMessage("");
    const body: any = { ...sleeveForm, price: Number(sleeveForm.price) };
    if (editId) body.sleeveId = editId;

    const res = await fetch("/api/admin/store/sleeves", {
      method: editId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) { setMessage("Sleeve saved!"); cancelEdit(); fetchAll(); }
    else setMessage(data.error ?? "Failed.");
  }

  async function saveCard() {
    if (!editId) return; // Cards are only patched in the store!
    setSaving(true); setMessage("");
    const body: any = { ...cardForm, price: Number(cardForm.price), cardId: editId };

    const res = await fetch("/api/admin/store/cards", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) { setMessage("Card Shop Info saved!"); cancelEdit(); fetchAll(); }
    else setMessage(data.error ?? "Failed.");
  }

  async function deactivatePack(packId: string) {
    await fetch("/api/admin/store", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packId }),
    });
    fetchAll();
  }

  async function deactivateSleeve(sleeveId: string) {
    await fetch("/api/admin/store/sleeves", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sleeveId }),
    });
    fetchAll();
  }

  const inputCls = "w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2";

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 uppercase tracking-wider text-gray-200">Black Market Management</h1>
      
      <div className="flex gap-4 border-b border-white/10 mb-6 pb-2">
        <button className={`px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'packs' ? 'bg-indigo-600' : 'bg-gray-800 hover:bg-gray-700'}`} onClick={() => { setActiveTab('packs'); cancelEdit(); }}>Packs</button>
        <button className={`px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'sleeves' ? 'bg-indigo-600' : 'bg-gray-800 hover:bg-gray-700'}`} onClick={() => { setActiveTab('sleeves'); cancelEdit(); }}>Sleeves</button>
        <button className={`px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'cards' ? 'bg-indigo-600' : 'bg-gray-800 hover:bg-gray-700'}`} onClick={() => { setActiveTab('cards'); cancelEdit(); }}>Single Cards</button>
      </div>

      <div className="bg-gray-900 border border-white/10 rounded-xl p-6 mb-8">
        <h2 className="text-xl mb-4 font-semibold">{editId ? "Edit" : (activeTab === "cards" ? "Please select a card from below to list it on the black market" : "Create")} {activeTab === "packs" ? "Pack" : activeTab === "sleeves" ? "Sleeve" : "Card"}</h2>
        
        {activeTab === "packs" ? (
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs text-gray-400 mb-1">Name</label><input className={inputCls} value={packForm.name} onChange={e => updatePack("name", e.target.value)} /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Price</label><input type="number" className={inputCls} value={packForm.price} onChange={e => updatePack("price", e.target.value)} /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Card Count</label><input type="number" className={inputCls} value={packForm.cardCount} onChange={e => updatePack("cardCount", e.target.value)} /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Image URL</label><input className={inputCls} value={packForm.imageUrl} onChange={e => updatePack("imageUrl", e.target.value)} /></div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Featured Item</label>
              <select className={inputCls} value={packForm.isFeatured ? "true" : "false"} onChange={e => updatePack("isFeatured", e.target.value === "true")}>
                <option value="false">No (Standard Panel)</option>
                <option value="true">Yes (Large Highlight Display)</option>
              </select>
            </div>
            <div><label className="block text-xs text-gray-400 mb-1">Discount</label><input type="number" className={inputCls} value={packForm.discount} onChange={e => updatePack("discount", e.target.value)} /></div>
            
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Description</label><textarea className={inputCls} value={packForm.description} onChange={e => updatePack("description", e.target.value)} /></div>
            
            <div className="col-span-2">
               <button className="bg-indigo-600 hover:bg-indigo-500 px-6 py-2 inline-block rounded-xl font-bold transition" disabled={saving} onClick={savePack}>{saving ? "Saving..." : "Save Pack"}</button>
               {editId && <button className="ml-4 text-gray-400 underline hover:text-white" onClick={cancelEdit}>Cancel</button>}
            </div>
          </div>
        ) : activeTab === "sleeves" ? (
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs text-gray-400 mb-1">Name</label><input className={inputCls} value={sleeveForm.name} onChange={e => updateSleeve("name", e.target.value)} /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Price</label><input type="number" className={inputCls} value={sleeveForm.price} onChange={e => updateSleeve("price", e.target.value)} /></div>
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Image URL</label><input className={inputCls} value={sleeveForm.imageUrl} onChange={e => updateSleeve("imageUrl", e.target.value)} /></div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Featured Item</label>
              <select className={inputCls} value={sleeveForm.isFeatured ? "true" : "false"} onChange={e => updateSleeve("isFeatured", e.target.value === "true")}>
                <option value="false">No (Standard Panel)</option>
                <option value="true">Yes (Large Highlight Display)</option>
              </select>
            </div>
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Description</label><textarea className={inputCls} value={sleeveForm.description} onChange={e => updateSleeve("description", e.target.value)} /></div>
            <div className="col-span-2">
               <button className="bg-indigo-600 hover:bg-indigo-500 px-6 py-2 inline-block rounded-xl font-bold transition" disabled={saving} onClick={saveSleeve}>{saving ? "Saving..." : "Save Sleeve"}</button>
               {editId && <button className="ml-4 text-gray-400 underline hover:text-white" onClick={cancelEdit}>Cancel</button>}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
             {!editId ? (
                <div className="col-span-2 text-gray-500 italic p-4 text-center border-2 border-dashed border-gray-700 rounded-lg">
                   Select a card from the index below to manage its Black Market listing status.
                </div>
             ) : (
                <>
                <div><label className="block text-xs text-gray-400 mb-1">Black Market Price</label><input type="number" className={inputCls} value={cardForm.price} onChange={e => updateCard("price", e.target.value)} /></div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Featured Item</label>
                  <select className={inputCls} value={cardForm.isFeatured ? "true" : "false"} onChange={e => updateCard("isFeatured", e.target.value === "true")}>
                    <option value="false">No (Standard Panel)</option>
                    <option value="true">Yes (Large Highlight Display)</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <button className="bg-indigo-600 hover:bg-indigo-500 px-6 py-2 inline-block rounded-xl font-bold transition" disabled={saving} onClick={saveCard}>{saving ? "Saving..." : "Save Card Market Info"}</button>
                  {editId && <button className="ml-4 text-gray-400 underline hover:text-white" onClick={cancelEdit}>Cancel</button>}
                </div>
                </>
             )}
          </div>
        )}
        {message && <p className="mt-4 text-green-400 font-bold">{message}</p>}
      </div>

      <h2 className="text-xl mb-4 font-semibold uppercase tracking-wider text-gray-400 text-sm">Existing {activeTab === "packs" ? "Packs" : activeTab === "sleeves" ? "Sleeves" : "Cards"}</h2>
      {loading ? <p className="text-gray-500">Loading...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(activeTab === "packs" ? packs : activeTab === "sleeves" ? sleeves : cards).map(item => (
            <div key={item._id} className="bg-gray-900 p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                    {item.name} 
                    {item.isFeatured && <span className="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 px-2 py-0.5 rounded-full uppercase tracking-wider">Featured</span>}
                </h3>
                {activeTab !== 'cards' && <p className="text-sm text-gray-400 mb-2 line-clamp-2">{item.description}</p>}
                {activeTab === 'cards' && <p className="text-xs text-gray-500 mb-2 uppercase">{item.rarity} | {item.type}</p>}
                
                <div className="bg-black/40 rounded p-2 mb-4 inline-block">
                    <span className="text-yellow-400 font-bold">🪙 {item.price || 0}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 px-4 py-2 text-sm rounded-lg font-bold transition flex-grow" onClick={() => activeTab === 'packs' ? startEditPack(item) : activeTab === 'sleeves' ? startEditSleeve(item) : startEditCard(item)}>Edit Shop Info</button>
                {activeTab !== 'cards' && item.isActive && (
                    <button className="bg-red-500/10 hover:bg-red-500/30 text-red-500 px-4 py-2 text-sm rounded-lg font-bold transition" onClick={() => activeTab === 'packs' ? deactivatePack(item._id) : deactivateSleeve(item._id)}>Deactivate</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
