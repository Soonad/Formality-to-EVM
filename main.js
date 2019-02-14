/*
 * Example - Running code on an ethereum-vm
 *
 *
 * To run this example in the browser, bundle this file
 * with browserify using `browserify index.js -o bundle.js`
 * and then load this folder onto a HTTP WebServer (e.g.
 * using node-static or `python -mSimpleHTTPServer`).
 */

// opcodes
const STOP          =   "00";
const ADD           =   "01";
const MUL           =   "02";
const SUB           =   "03";
const DIV           =   "04";
const AND           =   "16";
const OR            =   "17";
const XOR           =   "18";
const NOT           =   "19";
const CALLDATACOPY  =   "37";
const POP           =   "50";
const MLOAD         =   "51";
const MSTORE        =   "52";
const MSTORE8       =   "53";
const JUMP          =   "56";
const JUMPDEST      =   "5b";
const PUSH1         =   "60";
const PUSH2         =   "61";
const PUSH4         =   "63";
const PUSH32        =   "7f";
const DUP1          =   "80";
const DUP2          =   "81";
const DUP3          =   "82";

// Important memory positions
const BUFFER_SIZE_POS = "4f"


var Buffer = require("safe-buffer").Buffer; // use for Node.js <4.5.0
var VM = require("ethereumjs-vm");

// create a new VM instance
var vm = new VM();

// new_node(kind) -- Allocates a new node
var new_node = [
    // Stack contains kind -> x
    // get buffer last writable position
    PUSH1, BUFFER_SIZE_POS,
    MLOAD,
    PUSH1, BUFFER_SIZE_POS,
    ADD,
    // Now last value in stack is the last used position in the buffer

    // Update buffer size
    DUP1, // Duplicate position on stack because we need to
          // use this value later

    PUSH1, "04",
    ADD,
    PUSH1, BUFFER_SIZE_POS,
    MSTORE,
    // Again, last value in stack is the last used position in the buffer

    // White new node ports and kind
    // -- Proceed to next position in the buffer
    PUSH1, "01",
    ADD,
    // -- Connect port to itself
    DUP1,
    DUP1,
    MSTORE,

    // -- Proceed to next position in the buffer
    PUSH1, "01",
    ADD,
    // -- Connect port to itself
    DUP1,
    DUP1,
    MSTORE,

    // -- Proceed to next position in the buffer
    PUSH1, "01",
    ADD,
    // -- Connect port to itself
    DUP1,
    DUP1,
    MSTORE,

    // -- Proceed to next position in the buffer
    PUSH1, "01",
    ADD,
    // -- Store 'kind' in memory (Assuming its value is the next in stack)
    MSTORE
].join("");

// port(node, slot) -- Calculate the memoy position of a port
var port = [
    // Stack contains node -> stack -> x
    // port's position in memory = (node * 4) + slot + BUFFER_SIZE_POS + 1
    PUSH1, "4",
    MUL,
    PUSH1, BUFFER_SIZE_POS,
    PUSH1, "1",
    ADD,
    ADD,
    ADD
].join("");

// addr (port) -- Returns the node to which a port belongs
var addr = [
    // Stack contains port -> x
    PUSH1, "4",
    DIV
].join("");

// slot(port) -- Returns the slot of a port
var slot = [
    // Stack contains port -> x
    PUSH1, "3",
    AND
].join("");

// enter(port) -- returns the value stored in port memory position
var enter = [
    // Stack contains port -> x
    MLOAD
].join("");

// kind(node) -- Returns the type of the node
// 0 = era (i.e., a set or a garbage collector)
// 1 = con (i.e., a lambda or an application)
// 2 = fan (i.e., a pair or a let)
var kind = [
    // Stack contains node -> x
    // -- Get node kind position in memory where:
    //    NODE_POSITION = (node * 4) + BUFFER_SIZE_POS + 1
    //    NODE_KIND = NODE_POSITION + 3
    PUSH1, "4",
    MUL,
    PUSH1, BUFFER_SIZE_POS,
    PUSH1, "4",
    ADD,
    ADD,
    MLOAD //TODO: This gets a whole 256 bits word from memory, not just the
          //      value for node kind. Find a solution to this problem.
].join("");

// link(portA, portB) -- Links two ports
var link = [
    // Stack contains portA -> portB -> x
    DUP1, // Duplicate portA
    DUP3, // Duplicate portB
    // Now stack is PortB -> PortA -> PortA -> PortB -> x
    MSTORE, // mem[PortB] = PortA
    MSTORE  // mem[PortA] = PortB
].join("");

var reduce = [
    // TODO
].join("");

var rewrite = [
    // TODO
].join("");

var load = [
    // Load SIC graph to memory
    PUSH2, "ffff",
    PUSH1, "00",
    PUSH1, BUFFER_SIZE_POS,
    CALLDATACOPY,

    // Stop
    STOP
].join("");

const until = (stop, fn, val) => !stop(val) ? until(stop, fn, fn(val)) : val;
const lpad = (len, chr, str) => until((s) => s.length === len, (s) => chr + s, str);
const hex = (str) => "0x" + lpad(32, "0", str);
const repeat = (str, n) => n === 0 ? "" : str + repeat(str, n - 1);

vm.on("step", function ({pc, gasLeft, opcode, stack, depth, address, account, stateManager, memory, memoryWordCount}) {
    for (var i = 0; i < stack.length; ++i) {
      console.log("- " + i + ": " + hex(stack[i].toString("hex")));
    }
    console.log("PC: " + pc + " | GAS: " + gasLeft + " | OPCODE: " + opcode.name + " (" + opcode.fee + ")");
    console.log("MEM:", memory.slice(110, 130));
});

vm.runCode({
  code: Buffer.from(code, "hex"),
  gasLimit: Buffer.from("ffffffff", "hex"),
  data: Buffer.from("000000000000000000000000000000000000000000000000000000000000002806020104081C000104180C010A1510010E1916011A0D120109111401052220011E241D01211C2500", "hex")
}, function (err, results) {
  console.log("returned: " + results.return.toString("hex"));
  console.log("gasUsed: " + results.gasUsed.toString());
  console.log(err);
})
