import { BaseCommand, CommandArgs } from "../base/BaseCommand";

export class EchoCommand extends BaseCommand {
  get name(): string {
    return "/echo";
  }

  get description(): string {
    return "메시지 반복";
  }

  async execute({ value }: CommandArgs): Promise<string> {
    return value
      ? `Echo: ${value}`
      : "메시지를 입력해주세요. 예: /echo_안녕하세요";
  }
}
