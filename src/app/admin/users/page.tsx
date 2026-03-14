"use client";
import { useEffect, useState } from "react";

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  currency: number;
  isActive: boolean;
  createdAt: string;
  friends: string[];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [promptUserId, setPromptUserId] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState("0");
  const [resetConfirmUserId, setResetConfirmUserId] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => {
        setUsers(d.data ?? []);
        setLoading(false);
      });
  }, []);

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    setUsers((prev) =>
      prev.map((u) => (u._id === id ? { ...u, isActive: !isActive } : u))
    );
  }

  async function grantCurrency(id: string, amountToGrant: number) {
    if (isNaN(amountToGrant) || amountToGrant === 0) return;
    setPromptUserId(null); // Close the prompt
    await fetch("/api/currency", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: id, amount: amountToGrant, description: "Admin grant" }),
    });
    setUsers((prev) =>
      prev.map((u) => (u._id === id ? { ...u, currency: Math.max(0, u.currency + amountToGrant) } : u))
    );
  }

  async function resetCollection(id: string) {
    setResetting(true);
    await fetch(`/api/admin/users/${id}/collection`, { method: "DELETE" });
    setResetting(false);
    setResetConfirmUserId(null);
  }

  const filtered = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">User Management</h1>
      <p className="text-gray-400 mb-8">Manage all registered users.</p>

      <div className="mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by username or email..."
          className="w-full max-w-md bg-gray-800 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {loading ? (
        <div className="text-gray-500">Loading users...</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-gray-400 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Currency</th>
                <th className="px-4 py-3 text-left">Friends</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Joined</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((user) => (
                <tr key={user._id} className="bg-gray-900 hover:bg-gray-800/60 transition">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{user.username}</div>
                    <div className="text-gray-500 text-xs">{user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.role === "admin" ? "bg-purple-800/50 text-purple-300" : "bg-gray-700 text-gray-300"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-yellow-400">🪙 {user.currency.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-400">{user.friends?.length ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      user.isActive ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"
                    }`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => toggleActive(user._id, user.isActive)}
                        className="px-2.5 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-xs transition"
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => setPromptUserId(user._id)}
                        className="px-2.5 py-1 rounded-lg bg-yellow-900/40 hover:bg-yellow-800/60 text-yellow-300 text-xs transition"
                      >
                        💰 Currency
                      </button>
                      <button
                        onClick={() => setResetConfirmUserId(user._id)}
                        className="px-2.5 py-1 rounded-lg bg-red-900/40 hover:bg-red-800/60 text-red-300 text-xs transition"
                      >
                        🗑 Reset Collection
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-500">No users found.</div>
          )}
        </div>
      )}

      {promptUserId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-sm border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4">Grant / Deduct Currency</h3>
            <p className="text-sm text-gray-400 mb-4">Enter amount (negative to deduct)</p>
            <input
              type="number"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="w-full bg-gray-900 border border-white/10 rounded-lg px-4 py-2 text-white mb-6 focus:outline-none focus:border-indigo-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') grantCurrency(promptUserId, parseInt(amountInput) || 0);
                if (e.key === 'Escape') setPromptUserId(null);
              }}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setPromptUserId(null)}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={() => grantCurrency(promptUserId, parseInt(amountInput) || 0)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {resetConfirmUserId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-sm border border-red-500/30">
            <h3 className="text-lg font-bold text-white mb-2">Reset Collection</h3>
            <p className="text-sm text-gray-400 mb-1">
              This will permanently delete <span className="text-white font-semibold">all cards</span> from{" "}
              <span className="text-red-300 font-semibold">
                {users.find((u) => u._id === resetConfirmUserId)?.username}
              </span>
              &apos;s collection.
            </p>
            <p className="text-xs text-red-400 mb-6">This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setResetConfirmUserId(null)}
                disabled={resetting}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-medium transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => resetCollection(resetConfirmUserId)}
                disabled={resetting}
                className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-sm font-medium transition disabled:opacity-50"
              >
                {resetting ? "Resetting…" : "Reset Collection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
