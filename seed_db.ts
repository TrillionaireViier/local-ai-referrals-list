import { PrismaClient } from '@prisma/client';
import { fetchLocalAiLeaderboard } from './src/lib/localai';

const prisma = new PrismaClient();

async function main() {
  console.log("Fetching live leaderboard...");
  const leaderboard = await fetchLocalAiLeaderboard();
  console.log(`Fetched ${leaderboard.length} entries. Saving to DB...`);
  
  for (const entry of leaderboard) {
    await prisma.referralSnapshot.create({
      data: {
        username: entry.username,
        handle: entry.handle,
        referrals: parseInt(entry.referrals.replace(/,/g, ''), 10)
      }
    });
  }
  
  console.log("Done saving to DB.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
