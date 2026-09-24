import { fetchLocalAiLeaderboard } from "@/lib/localai";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    const leaderboard = await fetchLocalAiLeaderboard();
    
    // Save to DB
    for (const entry of leaderboard) {
      await prisma.referralSnapshot.create({
        data: {
          username: entry.username,
          handle: entry.handle,
          referrals: parseInt(entry.referrals.replace(/,/g, ''), 10)
        }
      });
    }

    return new Response(JSON.stringify({ success: true, count: leaderboard.length }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error: any) {
    console.error("Cron fetch error:", error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}
