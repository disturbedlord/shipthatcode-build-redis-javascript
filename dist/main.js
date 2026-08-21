"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
});
class Redis {
    execute = (command, args) => {
        const callback = this[command];
        if (typeof callback === "function") {
            return callback(args);
        }
        else {
            return "Command not found";
        }
    };
    Normalize = (inp) => {
        // Normalize the Inp, remove Quotes
        let normalizedText = [];
        let i = 0;
        let stack = new Array();
        let currText = "";
        while (i < inp.length) {
            if (inp[i] === '"' || inp[i] === "\'") {
                if (stack.length > 0 && stack[-1] === inp[i]) {
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
    PING = (args) => {
        if (args) {
            const norArg = this.Normalize(args);
            return `$${norArg.length}\r\n${norArg}\r\n`;
        }
        else
            return `+PONG\r\n`;
    };
}
const redis = new Redis();
rl.on("line", (line) => {
    if (!line)
        return;
    const data = line.split(" ");
    const cmd = data[0];
    const args = data.slice(1).join(" ");
    const response = redis.execute(cmd, args);
    process.stdout.write(response);
});
rl.on("close", () => process.exit());
//# sourceMappingURL=main.js.map