"use client";
import { useEffect, useState } from "react";
import { AdminStats } from "@/types";

export default function AdminStatisticsPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/statistics")
      .then((r) => r.json())
      .then((d) => {
        setStats(d.data ?? null);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-gray-500">Loading statistics...</div>;
  if (!stats) return <div className="text-red-400">Failed to load statistics.</div>;

  const kpiCards = [
    { label: "Total Users", value: stats.totalUsers, icon: "👥" },
    { label: "Active Users", value: stats.activeUsers, icon: "✅" },
    { label: "New (7d)", value: stats.newUsersLast7Days, icon: "🆕" },
    { label: "New (30d)", value: stats.newUsersLast30Days, icon: "📅" },
    { label: "Total Cards", value: stats.totalCards, icon: "🃏" },
    { label: "Active Packs", value: stats.totalPacks, icon: "📦" },
    { label: "All Transactions", value: stats.totalTransactions, icon: "💳" },
    { label: "Currency in Circulation", value: `🪙 ${stats.totalCurrencyInCirculation.toLocaleString()}`, icon: "🏦" },
    { label: "Packs Sold (7d)", value: stats.packsPurchasedLast7Days, icon: "🛒" },
    { label: "Packs Sold (30d)", value: stats.packsPurchasedLast30Days, icon: "📊" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Statistics</h1>
      <p className="text-gray-400 mb-10">Platform-wide analytics.</p>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {kpiCards.map((k) => (
          <div key={k.label} className="bg-gray-900 border border-white/10 rounded-2xl p-5">
            <div className="text-xl mb-2">{k.icon}</div>
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">{k.label}</div>
            <div className="text-xl font-bold text-white">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Two column: top spenders + rarity dist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Top Spenders */}
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Top Spenders</h2>
          {stats.topSpenders.length === 0 ? (
            <p className="text-gray-500 text-sm">No data yet.</p>
          ) : (
            <div className="space-y-2">
              {stats.topSpenders.map((s, i) => (
                <div key={s.userId} className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-sm w-5">{i + 1}.</span>
                    <span className="font-medium">{s.username}</span>
                  </div>
                  <span className="text-yellow-400 text-sm">🪙 {s.spent.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rarity Distribution */}
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Card Rarity Distribution</h2>
          {Object.keys(stats.cardRarityDistribution).length === 0 ? (
            <p className="text-gray-500 text-sm">No cards yet.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(stats.cardRarityDistribution).map(([rarity, count]) => {
                const total = Object.values(stats.cardRarityDistribution).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={rarity}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize text-gray-300">{rarity}</span>
                      <span className="text-gray-500">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Revenue by Day */}
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Revenue by Day (last 30 days)</h2>
        {stats.revenueByDay.length === 0 ? (
          <p className="text-gray-500 text-sm">No transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-500 text-xs uppercase">
                <tr>
                  <th className="text-left pb-2">Date</th>
                  <th className="text-right pb-2">Currency Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats.revenueByDay.map((row) => (
                  <tr key={row.date} className="text-gray-300">
                    <td className="py-2">{row.date}</td>
                    <td className="py-2 text-right text-yellow-400">🪙 {row.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Daily Active Users */}
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Daily Active Users (last 7 days)</h2>
        {stats.dailyActiveUsers.length === 0 ? (
          <p className="text-gray-500 text-sm">No activity yet.</p>
        ) : (
          <div className="flex items-end gap-2 h-24">
            {stats.dailyActiveUsers.map((day) => {
              const maxCount = Math.max(...stats.dailyActiveUsers.map((d) => d.count), 1);
              const height = Math.round((day.count / maxCount) * 100);
              return (
                <div key={day.date} className="flex flex-col items-center flex-1 gap-1">
                  <span className="text-xs text-gray-400">{day.count}</span>
                  <div
                    className="w-full bg-indigo-600 rounded-t-md"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs text-gray-600 truncate w-full text-center">
                    {day.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
