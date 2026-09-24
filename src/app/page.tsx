import { fetchLocalAiLeaderboard } from "@/lib/localai";

export const dynamic = "force-dynamic";

export default async function Home() {
  const leaderboard = await fetchLocalAiLeaderboard();

  return (
    <main className="min-h-screen bg-black text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-[#e6c04a]">local.ai Referral Leaderboard</h1>
        
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold w-16 text-center">#</th>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold text-right">Referrals</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                    Loading data...
                  </td>
                </tr>
              ) : (
                leaderboard.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-center text-slate-500 font-mono text-sm">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-200">{entry.username}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{entry.handle}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-[#e0b23a] font-bold">
                      {entry.referrals}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
