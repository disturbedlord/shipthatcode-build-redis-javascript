const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
});

class Redis {
  execute = (command: string, args: string) => {
    const callback = (this as any)[command.toUpperCase()];
    if (typeof callback === "function") {
      return callback(args);
    } else {
      return "Command not found";
    }
  };

  private bulkString = (inp: string) => {
    const normalizedInp = this.Normalize(inp);
    return `$${normalizedInp.length}\r\n${normalizedInp}\r\n`;
  };

  private Normalize = (inp: string) => {
    // Normalize the Inp, remove Quotes
    let normalizedText = [] as string[];
    let i = 0;
    let stack = new Array();
    let currText = "";
    while (i < inp.length) {
      if (inp[i] === '"' || inp[i] === "\'") {
        if (stack.length > 0 && stack[stack.length - 1] === inp[i]) {
          // Closing Tag
          stack.pop();
          normalizedText.push(currText);
          currText = "";
        } else stack.push(inp[i]);
      } else {
        currText += inp[i];
      }
      i++;
    }

    if (currText.length > 0) normalizedText.push(currText);
    return normalizedText.join(" ");
  };

  private PING = (args?: string) => {
    if (args) {
      return this.bulkString(args);
    } else return `+PONG\r\n`;
  };

  private ECHO = (args?: string) => {
    if (!args) return this.bulkString("");
    else {
      return this.bulkString(args);
    }
  };
}

const redis = new Redis();
rl.on("line", (line: string) => {
  if (!line) return;
  const data = line.split(" ");
  const cmd = data[0];
  const args = data.slice(1).join(" ");
  const response = redis.execute(cmd!, args);
  process.stdout.write(response);
});

rl.on("close", () => process.exit());
