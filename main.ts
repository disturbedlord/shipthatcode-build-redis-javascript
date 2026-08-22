const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
});

class Redis {
  inMemoryDS = new Map<string, string>();
  ARITY = {
    PING: [0, 1],
    ECHO: [1, 1],
    COMMAND: [0, 0],
    SET: [2, 2],
    GET: [1, 1],
  };

  Serialization = {
    bulkString: (a?: string) => {
      const normalizedInp = this.Normalize(a);

      if (!normalizedInp) return `$-1\r\n`;
      else return `$${normalizedInp.length}\r\n${normalizedInp}\r\n`;
    },
    simpleString: (a: string) => `+${a}\r\n`,
    error: (e: string) => `-${e}\r\n`,
    integers: (i: number) => `:${i}\r\n`,
    invalidArgs: (command: string) =>
      `-ERR wrong number of arguments for '${command}' command\r\n`,
  };

  execute = (command: string, args: string[]) => {
    const callback = (this as any)[command];
    if (typeof callback === "function") {
      const [lo, hi] = (this.ARITY as any)[command];
      if (args.length < lo || args.length > hi)
        return this.Serialization.invalidArgs(command);
      return callback(args);
    } else {
      return this.Serialization.error(`ERR unknown command '${command}'`);
    }
  };

  private Normalize = (inp?: string) => {
    // Normalize the Inp, remove Quotes
    let normalizedText = [] as string[];
    let i = 0;
    let stack = new Array();
    let currText = "";
    if (!inp) return currText;
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

  private PING = (args: string[]) => {
    if (args.length === 1) {
      return this.Serialization.bulkString(args[0]!);
    } else return `+PONG\r\n`;
  };

  private ECHO = (args: string[]) => {
    return this.Serialization.bulkString(args[0]!);
  };

  private COMMAND = (args: string[]) => {
    return this.Serialization.simpleString("OK");
  };

  private SET = (args: string[]) => {
    const key = args[0]!;
    const value = args[1]!;
    this.inMemoryDS.set(key, value);
    return this.Serialization.simpleString("OK");
  };

  private GET = (args: string[]) => {
    const key = args[0]!;
    return this.Serialization.bulkString(this.inMemoryDS.get(key));
  };
}

const redis = new Redis();
let argsLen = 0,
  argSize = 0,
  arg = "";

let params = [] as string[];

let state = 0; // 0 => size , 1 => args len , 2 => arg itself
const parseCommand = (stream: string) => {
  const read = (s: string, skip: string, len?: number): string => {
    let i = 0;
    let text = "";
    if (!len) len = s.length;

    while (i < s.length && i < len) {
      if (s[i] !== skip) text += s[i];
      i++;
    }
    return text;
  };

  if (!stream) return;
  switch (state) {
    case 0: {
      if (!stream.startsWith("*")) return;
      argsLen = parseInt(read(stream, "*")) ?? 0;
      //console.log(argsLen);
      state = 1; // change to arg len parsing state
      break;
    }
    case 1: {
      if (!argsLen || !stream.startsWith("$")) return;
      argSize = parseInt(read(stream, "$")) ?? 0;
      //console.log(argSize);

      state = 2; // change to arg parsing state
      break;
    }
    case 2: {
      if (!argSize) return;
      arg = read(stream, "", argSize);
      //console.log(arg);
      argsLen--;
      params.push(arg);
      if (argsLen > 0) state = 1;
      else return false;
    }
  }

  return true;
};

rl.on("line", (line: string) => {
  if (!line) return;
  const keepReading = parseCommand(line);
  if (keepReading) return;
  //console.log(params);
  const cmd = params[0]?.toUpperCase();
  const args = params.slice(1);
  const response = redis.execute(cmd!, args);
  process.stdout.write(response);
  // Reset parser State to 0 to read length
  state = 0;
  params = [] as string[];
});

rl.on("close", () => process.exit());
