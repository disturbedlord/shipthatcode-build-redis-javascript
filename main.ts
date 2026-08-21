const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
});

const ParseQuotes = (x: string) => {
  let text = "";
  let i = 0;
  while (i < x.length) {
    if (x[i] !== '"') text += x[i];
    i++;
  }

  return text;
};

var commandTable = new Map<string, (p: any) => any>();
commandTable.set("PING", (p: string) => {
  if (p.length > 0) {
    p = ParseQuotes(p);
    return `$${p.length}\r\n${p}\r\n`;
  } else return "+PONG\r\n";
});

const ParseCommand = (inp: string) => {
  const cmd = inp.split(" ");
  if (cmd && cmd[0])
    if (commandTable.has(cmd[0])) {
      const callback = commandTable.get(cmd[0]);
      if (callback) {
        return callback(cmd.slice(1).join(" ") ?? "");
      }
    }
};

rl.on("line", (line: string) => {
  if (!line) return;
  const response = ParseCommand(line);
  process.stdout.write(response);
});

rl.on("close", () => process.exit());
