"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
});
const ParseQuotes = (x) => {
  let text = "";
  let i = 0;
  while (i < x.length) {
    if (x[i] !== '"') text += x[i];
    i++;
  }
  return text;
};
var commandTable = new Map();
commandTable.set("PING", (p) => {
  if (p.length > 0) {
    p = ParseQuotes(p);
    return `$${p.length}\r\n${p}\r\n`;
  } else return "+PONG\r\n";
});
const ParseCommand = (inp) => {
  const cmd = inp.split(" ");
  if (cmd && cmd[0])
    if (commandTable.has(cmd[0])) {
      const callback = commandTable.get(cmd[0]);
      if (callback) {
        return callback(cmd.slice(1).join(" ") || "");
      }
    }
};
rl.on("line", (line) => {
  if (!line) return;
  const response = ParseCommand(line);
  process.stdout.write(response);
});
rl.on("close", () => process.exit());
//# sourceMappingURL=main.js.map
