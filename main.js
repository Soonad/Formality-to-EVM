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

var data = tests.case4;

// Outputs the script file contents
console.log("#!/bin/bash")
console.log(`CODE=${code}`);
console.log(`\nDATA=${data}`);
console.log("\nCOMMAND=\"evm --code $CODE --debug --input $DATA --nomemory run\"");
console.log("\necho $COMMAND\neval $COMMAND 2> output.txt");
