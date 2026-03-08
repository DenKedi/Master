"use client";
import { useEffect, useState } from "react";
import { IPack } from "@/types";

const EMPTY_PACK = {
  name: "", description: "", price: 100, cardCount: 5,
  guaranteedRarity: "", imageUrl: "/packs/default.png",
  type: "standard", discount: 0, expiresAt: "",
};

export default function AdminStorePage() {
  const [packs, setPacks] = useState<IPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...EMPTY_PACK });
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function fetchPacks() {
    fetch("/api/admin/store")
      .then((r) => r.json())
      .then((d) => { setPacks(d.data ?? []); setLoading(false); });
  }

  useEffect(() => { fetchPacks(); }, []);

  function update(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function startEdit(pack: IPack) {
    setEditId(pack._id);
    setForm({
      name: pack.name, description: pack.description,
      price: pack.price, cardCount: pack.cardCount,
      guaranteedRarity: pack.guaranteedRarity ?? "",
      imageUrl: pack.imageUrl, type: pack.type,
      discount: pack.discount ?? 0,
      expiresAt: pack.expiresAt ? new Date(pack.expiresAt).toISOString().slice(0, 10) : "",
    });
  }

  function cancelEdit() {
    setEditId(null);
    setForm({ ...EMPTY_PACK });
    setMessage("");
  }

  async function savePack() {
    setSaving(true);
    setMessage("");
    const body: Record<string, unknown> = {
      name: form.name, description: form.description,
      price: Number(form.price), cardCount: Number(form.cardCount),
      imageUrl: form.imageUrl, type: form.type,
      discount: form.discount ? Number(form.discount) : undefined,
      expiresAt: form.expiresAt || undefined,
      guaranteedRarity: form.guaranteedRarity || undefined,
    };
    let res;
    if (editId) {
      body.packId = editId;
      res = await fetch("/api/admin/store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      res = await fetch("/api/admin/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      setMessage(editId ? "Pack updated!" : "Pack created!");
      cancelEdit();
      fetchPacks();
    } else {
      setMessage(data.error ?? "Error saving pack.");
    }
  }

  async function deactivatePack(packId: string) {
    await fetch("/api/admin/store", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packId }),
    });
    fetchPacks();
  }

  const inputCls = "w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm";

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Store Management</h1>
      <p className="text-gray-400 mb-8">Create and manage shop packs.</p>

      {/* Form */}
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 mb-10">
        <h2 className="text-lg font-semibold mb-5">{editId ? "Edit Pack" : "Create New Pack"}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div><label className="block text-xs text-gray-400 mb-1">Name *</label>
            <input className={inputCls} value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Starter Pack" />
          </div>
          <div><label className="block text-xs text-gray-400 mb-1">Type</label>
            <select className={inputCls} value={form.type} onChange={(e) => update("type", e.target.value)}>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="sale">Sale</option>
              <option value="bundle">Bundle</option>
            </select>
          </div>
          <div><label className="block text-xs text-gray-400 mb-1">Price (coins) *</label>
            <input className={inputCls} type="number" min={0} value={form.price} onChange={(e) => update("price", e.target.value)} />
          </div>
          <div><label className="block text-xs text-gray-400 mb-1">Card Count *</label>
            <input className={inputCls} type="number" min={1} value={form.cardCount} onChange={(e) => update("cardCount", e.target.value)} />
          </div>
          <div><label className="block text-xs text-gray-400 mb-1">Discount (%)</label>
            <input className={inputCls} type="number" min={0} max={100} value={form.discount} onChange={(e) => update("discount", e.target.value)} />
          </div>
          <div><label className="block text-xs text-gray-400 mb-1">Guaranteed Rarity</label>
            <select className={inputCls} value={form.guaranteedRarity} onChange={(e) => update("guaranteedRarity", e.target.value)}>
              <option value="">None</option>
              <option value="uncommon">Uncommon</option>
              <option value="rare">Rare</option>
              <option value="epic">Epic</option>
              <option value="legendary">Legendary</option>
            </select>
          </div>
          <div><label className="block text-xs text-gray-400 mb-1">Expires At</label>
            <input className={inputCls} type="date" value={form.expiresAt} onChange={(e) => update("expiresAt", e.target.value)} />
          </div>
          <div><label className="block text-xs text-gray-400 mb-1">Image URL *</label>
            <input className={inputCls} value={form.imageUrl} onChange={(e) => update("imageUrl", e.target.value)} placeholder="/packs/starter.png" />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-xs text-gray-400 mb-1">Description *</label>
          <textarea
            className={`${inputCls} resize-none h-20`}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Pack description..."
          />
        </div>
        {message && <p className="text-sm mb-4 text-indigo-300">{message}</p>}
        <div className="flex gap-3">
          <button
            onClick={savePack}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm transition disabled:opacity-50"
          >
            {saving ? "Saving..." : editId ? "Update Pack" : "Create Pack"}
          </button>
          {editId && (
            <button onClick={cancelEdit} className="px-5 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-sm transition">
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Pack List */}
      <h2 className="text-xl font-semibold mb-4">All Packs ({packs.length})</h2>
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-gray-400 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-left">Cards</th>
                <th className="px-4 py-3 text-left">Discount</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {packs.map((pack) => (
                <tr key={pack._id} className="bg-gray-900 hover:bg-gray-800/60 transition">
                  <td className="px-4 py-3 font-medium text-white">{pack.name}</td>
                  <td className="px-4 py-3 capitalize text-gray-400">{pack.type}</td>
                  <td className="px-4 py-3 text-yellow-400">🪙 {pack.price}</td>
                  <td className="px-4 py-3 text-gray-400">{pack.cardCount}</td>
                  <td className="px-4 py-3 text-gray-400">{pack.discount ? `${pack.discount}%` : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      pack.isActive ? "bg-green-900/40 text-green-400" : "bg-gray-700 text-gray-500"
                    }`}>
                      {pack.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(pack)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-900/40 hover:bg-indigo-700/60 text-indigo-300 text-xs transition"
                      >
                        Edit
                      </button>
                      {pack.isActive && (
                        <button
                          onClick={() => deactivatePack(pack._id)}
                          className="px-2.5 py-1 rounded-lg bg-red-900/30 hover:bg-red-800/60 text-red-300 text-xs transition"
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
