import { BaseCommand } from "./BaseCommand";

export class CommandRegistry {
  private commands = new Map<string, BaseCommand>();

  register(command: BaseCommand): void {
    this.commands.set(command.name, command);
  }

  async execute(commandName: string, args: any): Promise<string> {
    const command = this.commands.get(commandName);
    if (!command) {
      return `알 수 없는 명령어입니다: ${commandName}\n/help 명령어로 도움말을 확인해주세요.`;
    }
    return command.execute(args);
  }

  getAllCommands(): BaseCommand[] {
    return Array.from(this.commands.values());
  }

  getCommandsForBot(): Array<{ command: string; description: string }> {
    return this.getAllCommands().map(cmd => ({
      command: cmd.name.replace("/", ""),
      description: cmd.description
    }));
  }
}
