import { fetchLocalAiLeaderboard, fetchPromoStatus } from "@/lib/localai";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const dynamic = "force-dynamic";

export default async function Home() {
  // Fetch live data
  const currentLeaderboard = await fetchLocalAiLeaderboard();
  const promoStatus = await fetchPromoStatus();
  
  // Fetch snapshots for 1d, 7d, 30d baseline calculation
  const now = Date.now();
  const target1d = now - 24 * 60 * 60 * 1000;
  const target7d = now - 7 * 24 * 60 * 60 * 1000;
  const target30d = now - 30 * 24 * 60 * 60 * 1000;

  // We fetch snapshots from the last 60 days
  const snapshots = await prisma.referralSnapshot.findMany({
    where: {
      createdAt: {
        gte: new Date(now - 60 * 24 * 60 * 60 * 1000)
      }
    }
  });

  const best1d = new Map<string, { diff: number; referrals: number }>();
  const best7d = new Map<string, { diff: number; referrals: number }>();
  const best30d = new Map<string, { diff: number; referrals: number }>();

  for (const snap of snapshots) {
    const time = snap.createdAt.getTime();
    const diff1 = Math.abs(time - target1d);
    const diff7 = Math.abs(time - target7d);
    const diff30 = Math.abs(time - target30d);

    const ext1 = best1d.get(snap.username);
    if (!ext1 || diff1 < ext1.diff) best1d.set(snap.username, { diff: diff1, referrals: snap.referrals });

    const ext7 = best7d.get(snap.username);
    if (!ext7 || diff7 < ext7.diff) best7d.set(snap.username, { diff: diff7, referrals: snap.referrals });

    const ext30 = best30d.get(snap.username);
    if (!ext30 || diff30 < ext30.diff) best30d.set(snap.username, { diff: diff30, referrals: snap.referrals });
  }

  const map1d = new Map<string, number>();
  const map7d = new Map<string, number>();
  const map30d = new Map<string, number>();

  for (const [u, d] of best1d.entries()) map1d.set(u, d.referrals);
  for (const [u, d] of best7d.entries()) map7d.set(u, d.referrals);
  for (const [u, d] of best30d.entries()) map30d.set(u, d.referrals);

  const renderGrowth = (baselineRefs: number | undefined, currentRefs: number) => {
    if (baselineRefs === undefined) {
      return <span className="text-zinc-500 text-xs italic">немає даних</span>;
    }
    const diff = currentRefs - baselineRefs;
    const pct = baselineRefs > 0 ? (diff / baselineRefs) * 100 : 0;
    
    if (diff > 0) {
      return (
        <span className="text-emerald-400 text-sm">
          +{diff} <span className="opacity-70 text-xs">(+{pct.toFixed(1)}%)</span>
        </span>
      );
    } else if (diff < 0) {
      return (
        <span className="text-rose-400 text-sm">
          {diff} <span className="opacity-70 text-xs">({pct.toFixed(1)}%)</span>
        </span>
      );
    }
    return <span className="text-zinc-500 text-sm">0</span>;
  };

  return (
    <main className="min-h-screen bg-black text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center text-[#e6c04a]">local.ai Referral Leaderboard</h1>
        <div className="text-center text-zinc-500 mb-8">
          <p>Дані оновлюються в реальному часі. Динаміка порівнюється з минулими періодами.</p>
          <p className="mt-2 text-sm">
            <span className="text-[#e6c04a] font-semibold uppercase tracking-wider">Promotion End:</span>{" "}
            <span className="text-zinc-300">{promoStatus}</span>
          </p>
        </div>
        
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-semibold w-16 text-center">#</th>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold text-right">Referrals</th>
                  <th className="px-6 py-4 font-semibold text-right">24h Growth</th>
                  <th className="px-6 py-4 font-semibold text-right">7d Growth</th>
                  <th className="px-6 py-4 font-semibold text-right">30d Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {currentLeaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      Loading data...
                    </td>
                  </tr>
                ) : (
                  currentLeaderboard.map((entry, idx) => {
                    const currentRefs = parseInt(entry.referrals.replace(/,/g, ''), 10);
                    const refs1d = map1d.get(entry.username);
                    const refs7d = map7d.get(entry.username);
                    const refs30d = map30d.get(entry.username);

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
                          {renderGrowth(refs1d, currentRefs)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono">
                          {renderGrowth(refs7d, currentRefs)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono">
                          {renderGrowth(refs30d, currentRefs)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
