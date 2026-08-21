const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
});

class Redis {
  Serialization = {
    bulkString: (a: string) => {
      const normalizedInp = this.Normalize(a);

      if (!normalizedInp) return `$-1\r\n`;
      else return `$${normalizedInp.length}\r\n${normalizedInp}\r\n`;
    },
    simpleString: (a: string) => `+${a}\r\n`,
    error: (e: string) => `-${e}\r\n`,
    integers: (i: number) => `:${i}\r\n`,
  };

  execute = (command: string, args: string) => {
    const callback = (this as any)[command.toUpperCase()];
    if (typeof callback === "function") {
      return callback(args);
    } else {
      return "Command not found";
    }
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
      return this.Serialization.bulkString(args);
    } else return `+PONG\r\n`;
  };

  private ECHO = (args?: string) => {
    if (!args) return this.Serialization.bulkString("");
    else {
      return this.Serialization.bulkString(args);
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
