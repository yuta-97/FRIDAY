import { BaseCommand, CommandArgs } from "../base/BaseCommand";

export class DiceCommand extends BaseCommand {
  get name(): string {
    return "/dice";
  }

  get description(): string {
    return "주사위 굴리기";
  }

  async execute({ value }: CommandArgs): Promise<string> {
    try {
      const { count, sides } = this.parseParameters(value);
      const results = this.rollDice(count, sides);
      return this.formatResults(results, count, sides);
    } catch (error) {
      console.error("Dice command error:", error);
      return this.getHelpMessage();
    }
  }

  private parseParameters(value?: string): { count: number; sides: number } {
    let sides = 6;
    let count = 1;

    if (!value) {
      return { count, sides };
    }

    const params = value.split(",").map(p => p.trim());

    if (params.length === 1) {
      const num = parseInt(params[0]);
      if (num > 0 && num <= 100) {
        if (num <= 20) {
          count = num;
        } else {
          sides = num;
        }
      }
    } else if (params.length === 2) {
      const countParam = parseInt(params[0]);
      const sidesParam = parseInt(params[1]);

      if (countParam > 0 && countParam <= 20) count = countParam;
      if (sidesParam > 0 && sidesParam <= 1000) sides = sidesParam;
    }

    return { count, sides };
  }

  private rollDice(count: number, sides: number): number[] {
    const results: number[] = [];
    for (let i = 0; i < count; i++) {
      results.push(Math.floor(Math.random() * sides) + 1);
    }
    return results;
  }

  private formatResults(
    results: number[],
    count: number,
    sides: number
  ): string {
    const diceEmoji = this.getDiceEmoji(sides);
    const resultText = results.map(r => `**${r}**`).join(" ");
    const sum = results.reduce((a, b) => a + b, 0);

    let response = `${diceEmoji} ${sides}면 주사위 ${count}개 결과\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    response += `🎲 결과: ${resultText}\n`;

    if (count > 1) {
      response += `📊 합계: ${sum}\n`;
      response += `📈 평균: ${(sum / count).toFixed(1)}\n`;
    }

    response += `\n💡 사용법:
/dice - 6면 주사위 1개
/dice_3 - 6면 주사위 3개
/dice_20 - 20면 주사위 1개
/dice_2,10 - 10면 주사위 2개`;

    return response;
  }

  private getHelpMessage(): string {
    return `❌ 주사위를 굴리는 중 오류가 발생했습니다.

💡 사용법:
/dice - 6면 주사위 1개
/dice_3 - 6면 주사위 3개  
/dice_20 - 20면 주사위 1개
/dice_2,10 - 10면 주사위 2개`;
  }

  private getDiceEmoji(sides: number): string {
    if (sides <= 6) return "🎲";
    if (sides <= 12) return "🎯";
    if (sides <= 20) return "🎮";
    return "🔢";
  }
}
