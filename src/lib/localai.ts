import * as cheerio from 'cheerio';

export interface LeaderboardEntry {
  username: string;
  handle: string;
  referrals: string;
}

export async function fetchLocalAiLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const response = await fetch('https://local.ai/referrals', { next: { revalidate: 60 } });
    if (!response.ok) return [];
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const leaderboard: LeaderboardEntry[] = [];

    $('a.group').each((i, el) => {
      const username = $(el).find('span.truncate.text-\\[14px\\]').text().trim();
      const handle = $(el).find('span.block.truncate.text-\\[11\\.5px\\]').text().trim();
      const referrals = $(el).find('span.block.text-\\[15px\\]').text().trim();
      
      if (username && referrals) {
        leaderboard.push({ username, handle, referrals });
      }
    });

    return leaderboard;
  } catch (error) {
    console.error("Failed to fetch local.ai leaderboard:", error);
    return [];
  }
}
