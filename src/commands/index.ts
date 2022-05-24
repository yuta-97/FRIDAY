import TelegramBot from "node-telegram-bot-api";

export default async function Handler(bot: TelegramBot) {
  bot.on("message", async msg => {
    console.log("Message info >>> ", msg);
    const chatId = msg.chat.id;
    console.log("chatID is >>> ", chatId);
    if (msg.text.startsWith("/")) {
      const filteredMsg: string = await filterCommand(msg.text);
      bot.sendMessage(chatId, filteredMsg);
    }
  });
}

async function filterCommand(input: string): Promise<string> {
  const data: string[] = input.split("_");
  let command: string;
  let value: string;
  if (data.length === 2) {
    command = data[0];
    value = data[1];
  } else {
    command = data[0];
  }

  switch (command) {
    case "/start":
      return "test";
    case "/help":
      return "preparing...";
    case "/echo":
      return "echo!!";
    default:
      return "Command not found.";
  }
}
