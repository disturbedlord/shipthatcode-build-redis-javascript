"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
});
class Redis {
    constructor() {
        this.ARITY = {
            PING: [0, 1],
            ECHO: [1, 1],
            COMMAND: [0, 0],
        };
        this.Serialization = {
            bulkString: (a) => {
                const normalizedInp = this.Normalize(a);
                if (!normalizedInp)
                    return `$-1\r\n`;
                else
                    return `$${normalizedInp.length}\r\n${normalizedInp}\r\n`;
            },
            simpleString: (a) => `+${a}\r\n`,
            error: (e) => `-${e}\r\n`,
            integers: (i) => `:${i}\r\n`,
            invalidArgs: (command) => `-ERR wrong number of arguments for '${command}' command\r\n`,
        };
        this.execute = (command, args) => {
            const callback = this[command];
            if (typeof callback === "function") {
                const [lo, hi] = this.ARITY[command];
                if (args.length < lo || args.length > hi)
                    return this.Serialization.invalidArgs(command);
                return callback(args);
            }
            else {
                return this.Serialization.error(`ERR unknown command '${command}'`);
            }
        };
        this.Normalize = (inp) => {
            // Normalize the Inp, remove Quotes
            let normalizedText = [];
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
                    }
                    else
                        stack.push(inp[i]);
                }
                else {
                    currText += inp[i];
                }
                i++;
            }
            if (currText.length > 0)
                normalizedText.push(currText);
            return normalizedText.join(" ");
        };
        this.PING = (args) => {
            if (args && args.length === 1) {
                return this.Serialization.bulkString(args);
            }
            else
                return `+PONG\r\n`;
        };
        this.ECHO = (args) => {
            if (!args)
                return this.Serialization.bulkString("");
            else {
                return this.Serialization.bulkString(args);
            }
        };
        this.COMMAND = (args) => {
            return this.Serialization.simpleString("OK");
        };
    }
}
const redis = new Redis();
rl.on("line", (line) => {
    var _a;
    if (!line)
        return;
    const data = line.split(" ");
    const cmd = (_a = data[0]) === null || _a === void 0 ? void 0 : _a.toUpperCase();
    const args = data.slice(1);
    const response = redis.execute(cmd, args);
    process.stdout.write(response);
});
rl.on("close", () => process.exit());
//# sourceMappingURL=main.js.map