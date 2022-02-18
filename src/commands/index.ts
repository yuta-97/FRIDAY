export default async function filterCommand(input: string): Promise<string> {
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
