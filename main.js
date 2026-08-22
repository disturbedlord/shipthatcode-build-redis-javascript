"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
});
class Redis {
    constructor() {
        this.inMemoryDS = new Map();
        this.ARITY = {
            PING: [0, 1],
            ECHO: [1, 1],
            COMMAND: [0, 0],
            SET: [2, 2],
            GET: [1, 1],
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
            if (!inp)
                return currText;
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
            if (args.length === 1) {
                return this.Serialization.bulkString(args[0]);
            }
            else
                return `+PONG\r\n`;
        };
        this.ECHO = (args) => {
            return this.Serialization.bulkString(args[0]);
        };
        this.COMMAND = (args) => {
            return this.Serialization.simpleString("OK");
        };
        this.SET = (args) => {
            const key = args[0];
            const value = args[1];
            this.inMemoryDS.set(key, value);
            return this.Serialization.simpleString("OK");
        };
        this.GET = (args) => {
            const key = args[0];
            return this.Serialization.bulkString(this.inMemoryDS.get(key));
        };
    }
}
const redis = new Redis();
let argsLen = 0, argSize = 0, arg = "";
let params = [];
let state = 0; // 0 => size , 1 => args len , 2 => arg itself
const parseCommand = (stream) => {
    var _a, _b;
    const read = (s, skip, len) => {
        let i = 0;
        let text = "";
        if (!len)
            len = s.length;
        while (i < s.length && i < len) {
            if (s[i] !== skip)
                text += s[i];
            i++;
        }
        return text;
    };
    if (!stream)
        return;
    switch (state) {
        case 0: {
            if (!stream.startsWith("*"))
                return;
            argsLen = (_a = parseInt(read(stream, "*"))) !== null && _a !== void 0 ? _a : 0;
            //console.log(argsLen);
            state = 1; // change to arg len parsing state
            break;
        }
        case 1: {
            if (!argsLen || !stream.startsWith("$"))
                return;
            argSize = (_b = parseInt(read(stream, "$"))) !== null && _b !== void 0 ? _b : 0;
            //console.log(argSize);
            state = 2; // change to arg parsing state
            break;
        }
        case 2: {
            if (!argSize)
                return;
            arg = read(stream, "", argSize);
            //console.log(arg);
            argsLen--;
            params.push(arg);
            if (argsLen > 0)
                state = 1;
            else
                return false;
        }
    }
    return true;
};
rl.on("line", (line) => {
    var _a;
    if (!line)
        return;
    const keepReading = parseCommand(line);
    if (keepReading)
        return;
    //console.log(params);
    const cmd = (_a = params[0]) === null || _a === void 0 ? void 0 : _a.toUpperCase();
    const args = params.slice(1);
    const response = redis.execute(cmd, args);
    process.stdout.write(response);
    // Reset parser State to 0 to read length
    state = 0;
    params = [];
});
rl.on("close", () => process.exit());
//# sourceMappingURL=main.js.map