/*
 * Example - Running code on an ethereum-vm
 *
 *
 * To run this example in the browser, bundle this file
 * with browserify using `browserify index.js -o bundle.js`
 * and then load this folder onto a HTTP WebServer (e.g.
 * using node-static or `python -mSimpleHTTPServer`).
 */

var net = require('./net.js');
var tests = require('./tests.js');

 /////////// Impotant variables ///////////
 //var Buffer = require("safe-buffer").Buffer; // use for Node.js <4.5.0
 //var VM = require("ethereumjs-vm");

 // create a new VM instance
 //var vm = new VM();

////////////////////// EVM CODE //////////////////////

var code = [
    // Load SIC graph to memory
    net.PUSH2, "ffff",
    net.PUSH1, "00",
    net.PUSH1, net.BUFFER_SIZE_POS,
    net.CALLDATACOPY,

    // Code
    tests.reduceTest,

    // Stop
    net.STOP
].join("");

var data = tests.case1;

// Outputs the script file contents
console.log("#!/bin/bash")
console.log(`CODE=${code}`);
console.log(`\nDATA=${data}`);
console.log("\nCOMMAND=\"evm --code $CODE --debug --input $DATA --nomemory run\"");
console.log("\necho $COMMAND\neval $COMMAND 2> output.txt");










/*
const until = (stop, fn, val) => !stop(val) ? until(stop, fn, fn(val)) : val;
const lpad = (len, chr, str) => until((s) => s.length === len, (s) => chr + s, str);
const hex = (str) => "0x" + lpad(32, "0", str);
const repeat = (str, n) => n === 0 ? "" : str + repeat(str, n - 1);
*/
/*vm.on("step", function ({pc, gasLeft, opcode, stack, depth, address, account, stateManager, memory, memoryWordCount}) {
    for (var i = 0; i < stack.length; ++i) {
      console.log("- " + i + ": " + hex(stack[i].toString("hex")));
    }
    console.log("PC: " + pc + " | GAS: " + gasLeft + " | OPCODE: " + opcode.name + " (" + opcode.fee + ")");
    console.log("MEM:", memory.slice(31, 51));
});*/

/*
vm.runCode({
  code: Buffer.from(code, "hex"),
  gasLimit: Buffer.from("ffffffffffff", "hex"),
  //data: Buffer.from("000000000000000000000000000000000000000000000000000000000000002806020104081C000104180C010A1510010E1916011A0D120109111401052220011E241D01211C2500", "hex")
  /*data: Buffer.from(["0000000000000000000000000000000000000000000000000000000000000002", // size
                     "0000000000000004 0000000000000005 0000000000000006 0000000000000001", // node 1
                     "0000000000000000 0000000000000001 0000000000000002 0000000000000003", // node 2
                 ].join('').split(' ').join(''), "hex") *-/
 data: Buffer.from("000000000000000000000000000000000000000000000000000000000000000200000000000000040000000000000005000000000000000600000000000000010000000000000000000000000000000100000000000000020000000000000003", "hex")
}, function (err, results) {
  console.log("code: " + code);
  console.log("returned: " + results.return.toString("hex"));
  console.log("gasUsed: " + results.gasUsed.toString());
  console.log(err);
})
*/
