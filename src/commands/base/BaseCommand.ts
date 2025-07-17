import { UserService } from "@/services/UserService";
import TelegramBot from "node-telegram-bot-api";

export interface CommandArgs {
  value?: string;
  chatId: number;
  userId: string | undefined;
  userName: string;
  userService: UserService;
  bot: TelegramBot;
}

export abstract class BaseCommand {
  abstract execute(args: CommandArgs): Promise<string>;
  abstract get name(): string;
  abstract get description(): string;
}
