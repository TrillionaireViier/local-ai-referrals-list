import { Bot, InlineKeyboard } from "grammy";
import { fetchLocalAiLeaderboard } from "./localai";

const token = process.env.TELEGRAM_BOT_TOKEN;

export const getBot = () => {
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is missing");
  }
  return new Bot(token);
};

export const setupBot = (bot: Bot) => {
  bot.command("start", async (ctx) => {
    const keyboard = new InlineKeyboard()
      .text("🏆 Show Leaderboard", "show_leaderboard");

    await ctx.reply("Welcome! Click below to see the current local.ai referral leaderboard.", {
      reply_markup: keyboard,
    });
  });
  
  bot.command("leaderboard", async (ctx) => {
    await sendLeaderboard(ctx);
  });

  bot.on("callback_query:data", async (ctx) => {
    const data = ctx.callbackQuery.data;
    if (data === "show_leaderboard") {
      await ctx.answerCallbackQuery();
      await sendLeaderboard(ctx);
    }
  });

  bot.catch(async (err) => {
    console.error("Grammy error:", err);
  });
};

async function sendLeaderboard(ctx: any) {
  const leaderboard = await fetchLocalAiLeaderboard();
  
  if (leaderboard.length === 0) {
    return ctx.reply("Currently no data available.");
  }
  
  let message = "🏆 **Local.ai Referral Leaderboard (Top 10)**\n\n";
  for (let i = 0; i < Math.min(10, leaderboard.length); i++) {
    const entry = leaderboard[i];
    message += `${i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🔹"} *${entry.username}* — ${entry.referrals} referrals\n`;
  }
  message += `\n🔗 [View Full Leaderboard](https://local-ai-referrals.vercel.app)`;
  
  await ctx.reply(message, { parse_mode: "Markdown", link_preview_options: { is_disabled: true } });
}
