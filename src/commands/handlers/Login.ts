import { BaseCommand, CommandArgs } from "../base/BaseCommand";

export class LoginCommand extends BaseCommand {
  get name(): string {
    return "/login";
  }

  get description(): string {
    return "로그인";
  }

  async execute(args: CommandArgs): Promise<string> {
    return "로그인 기능을 준비 중입니다... 🔧";
  }
}
