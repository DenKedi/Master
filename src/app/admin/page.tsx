import { auth } from "@/lib/nextauth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/mongodb";
import UserModel from "@/models/User";
import CardModel from "@/models/Card";
import PackModel from "@/models/Pack";
import TransactionModel from "@/models/Transaction";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") redirect("/hub");

  await connectDB();
  const [totalUsers, totalCards, totalPacks, totalTx] = await Promise.all([
    UserModel.countDocuments(),
    CardModel.countDocuments({ isActive: true }),
    PackModel.countDocuments({ isActive: true }),
    TransactionModel.countDocuments(),
  ]);

  const currencyAgg = await UserModel.aggregate([
    { $group: { _id: null, total: { $sum: "$currency" } } },
  ]);
  const totalCurrency = currencyAgg[0]?.total ?? 0;

  const stats = [
    { label: "Total Users", value: totalUsers, icon: "👥", href: "/admin/users" },
    { label: "Active Cards", value: totalCards, icon: "🃏", href: null },
    { label: "Active Packs", value: totalPacks, icon: "📦", href: "/admin/store" },
    { label: "Transactions", value: totalTx, icon: "💳", href: "/admin/statistics" },
    { label: "Currency in Circulation", value: `🪙 ${totalCurrency.toLocaleString()}`, icon: "🏦", href: null },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-gray-400 mb-10">Overview of your game platform.</p>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
        {stats.map((s) => (
          <div key={s.label} className="bg-gray-900 border border-white/10 rounded-2xl p-6">
            <div className="text-2xl mb-3">{s.icon}</div>
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">{s.label}</div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            {s.href && (
              <Link href={s.href} className="text-xs text-indigo-400 hover:underline mt-2 inline-block">
                Manage →
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
