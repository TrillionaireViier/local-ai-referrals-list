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

export async function fetchPromoStatus(): Promise<string> {
  try {
    // Check both referrals and rules page for any explicit dates
    const [refRes, rulesRes] = await Promise.all([
      fetch('https://local.ai/referrals', { next: { revalidate: 3600 } }),
      fetch('https://local.ai/referrals/rules', { next: { revalidate: 3600 } })
    ]);
    
    let textToParse = "";
    if (refRes.ok) textToParse += await refRes.text();
    if (rulesRes.ok) textToParse += await rulesRes.text();
    
    const $ = cheerio.load(textToParse);
    const fullText = $('body').text().replace(/\s+/g, ' ');
    
    // Look for explicit dates regarding the end of the promo
    const dateMatch = fullText.match(/(ends on|cutoff is|until|deadline is|concludes on|closes on|finishes on|will end on|final day is|over on) ([a-zA-Z]+ \d{1,2}(st|nd|rd|th)?(,? \d{4})?)/i);
    
    if (dateMatch) {
      return `Announced: ${dateMatch[0]}`;
    }
    
    if (fullText.includes("Until public launch")) {
      return "Until public launch (Cutoff to be announced)";
    }
    
    return "Ongoing (No end date specified yet)";
  } catch (error) {
    console.error("Failed to fetch promo status:", error);
    return "Unknown";
  }
}
