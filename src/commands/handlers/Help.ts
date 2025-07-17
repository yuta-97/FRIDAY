import { BaseCommand, CommandArgs } from "../base/BaseCommand";

export class HelpCommand extends BaseCommand {
  private registry?: any;

  get name(): string {
    return "/help";
  }

  get description(): string {
    return "도움말";
  }

  setRegistry(registry: any): void {
    this.registry = registry;
  }

  async execute(args: CommandArgs): Promise<string> {
    let helpText = "📖 도움말\n";

    if (this.registry) {
      const commands = this.registry.getAllCommands();
      helpText += commands
        .map((cmd: BaseCommand) => `${cmd.name} - ${cmd.description}`)
        .join("\n");
    } else {
      // 기본 도움말
      helpText += `/start - 시작하기
/help - 도움말 보기
/echo - 메시지 반복
/login - 로그인`;
    }

    return helpText;
  }
}
