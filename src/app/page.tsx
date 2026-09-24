import { fetchLocalAiLeaderboard } from "@/lib/localai";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const dynamic = "force-dynamic";

export default async function Home() {
  // Fetch live data
  const currentLeaderboard = await fetchLocalAiLeaderboard();
  
  // Fetch data from ~24 hours ago
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const yesterdaySnapshots = await prisma.referralSnapshot.findMany({
    where: {
      createdAt: {
        gte: new Date(yesterday.getTime() - 6 * 60 * 60 * 1000), // 6 hour window
        lte: new Date(yesterday.getTime() + 6 * 60 * 60 * 1000),
      }
    }
  });

  const yesterdayMap = new Map<string, number>();
  for (const snap of yesterdaySnapshots) {
    yesterdayMap.set(snap.username, snap.referrals);
  }

  return (
    <main className="min-h-screen bg-black text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center text-[#e6c04a]">local.ai Referral Leaderboard</h1>
        <p className="text-center text-zinc-500 mb-8">
          Дані оновлюються в реальному часі. Динаміка порівнюється з минулим днем.
        </p>
        
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold w-16 text-center">#</th>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold text-right">Referrals</th>
                <th className="px-6 py-4 font-semibold text-right">Growth (24h)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {currentLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    Loading data...
                  </td>
                </tr>
              ) : (
                currentLeaderboard.map((entry, idx) => {
                  const currentRefs = parseInt(entry.referrals.replace(/,/g, ''), 10);
                  const yesterdayRefs = yesterdayMap.get(entry.username);
                  
                  let diff = 0;
                  let pct = 0;
                  if (yesterdayRefs && yesterdayRefs > 0) {
                    diff = currentRefs - yesterdayRefs;
                    pct = (diff / yesterdayRefs) * 100;
                  }

                  return (
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
                      <td className="px-6 py-4 text-right font-mono">
                        {yesterdayRefs ? (
                          diff > 0 ? (
                            <span className="text-emerald-400 text-sm">
                              +{diff} (+{pct.toFixed(1)}%)
                            </span>
                          ) : diff < 0 ? (
                            <span className="text-rose-400 text-sm">
                              {diff} ({pct.toFixed(1)}%)
                            </span>
                          ) : (
                            <span className="text-zinc-500 text-sm">0</span>
                          )
                        ) : (
                          <span className="text-zinc-500 text-xs italic">немає даних</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
