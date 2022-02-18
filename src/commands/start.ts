import BotGenerator from "src/singleton/bot";
const bot = BotGenerator.getInstance();

bot.onText(/\/start/, (msg, match) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "what is your id?", {
    reply_markup: { keyboard: [[{ text: "this?" }], [{ text: "or this?" }]], one_time_keyboard: true },
  });
});
