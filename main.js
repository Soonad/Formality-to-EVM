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
const DUP4          =   "83";
const DUP5          =   "84";

// Important memory positions
const BUFFER_SIZE_POS = "4f"


var Buffer = require("safe-buffer").Buffer; // use for Node.js <4.5.0
var VM = require("ethereumjs-vm");

// create a new VM instance
var vm = new VM();

// new_node(kind) -- Allocates a new node
// gas cost = 63 + 18*
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

// node(node_id) -- Returns the memory position of a node
// gas cost = 20
var node = [
    // Stack contains: node_id -> x
    // NODE_POSITION = (node_id * 4) + BUFFER_SIZE_POS + 1
    PUSH1, "04",
    MUL
    PUSH1, BUFFER_SIZE_POS,
    PUSH1, "01",
    ADD,
    ADD
    // Stack contains: node_pos -> x
]

// port(node, slot) -- Calculate the memoy position of a port
// gas cost = 23
var port = [
    // Stack contains node -> slot -> x
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
// gas cost = 8
var addr = [
    // Stack contains port -> x
    PUSH1, "4",
    DIV
].join("");

// slot(port) -- Returns the slot of a port
// gas cost = 6
var slot = [
    // Stack contains port -> x
    PUSH1, "3",
    AND
].join("");

// enter(port) -- returns the value stored in port memory position
// gas cost = 3*
var enter = [
    // Stack contains port -> x
    MLOAD
].join("");

// kind(node) -- Returns the type of the node
// 0 = era (i.e., a set or a garbage collector)
// 1 = con (i.e., a lambda or an application)
// 2 = fan (i.e., a pair or a let)
// gas cost = 20 + 3*
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
// gas cost = 6 + 6*
var link = [
    // Stack contains: portA -> portB -> x
    DUP1, // Duplicate portA
    DUP3, // Duplicate portB
    // Now stack is: PortB -> PortA -> PortA -> PortB -> x
    MSTORE, // mem[PortB] = PortA
    MSTORE  // mem[PortA] = PortB
    // Now stack is: x
].join("");

var reduce = [
    // TODO
].join("");

// rewrite(nodeX, nodeY) -- Rewrites an active pair
// gas cost; kind(x) == kind(y) ? (true = 125 + 24*) : (false = 683 + 108*)
var rewrite = [
    // Stack contains nodeX -> nodeY -> x
    /*if kind(net, x) == kind(net, y) -- gas cost = ??? */
    PUSH1, "01",
    DUP2,
    /*port*/,
    /*enter*/,
    PUSH1, "01",
    DUP4,
    /*port*/,
    /*enter*/,
    /*link*/,

    PUSH1, "02",
    /*port*/,
    /*enter*/,
    PUSH1, "02",
    DUP3,
    /*port*/,
    /*enter*/,
    /*link*/,

    // Stack contains: x

    /* else */,
    // Stack contains: nodeX -> nodeY -> x
    DUP1,
    /*kind*/,
    /*new_node*/,
    PUSH1, BUFFER_SIZE_POS,
    MLOAD,
    // Stack contains: newNodeA -> nodeX -> nodeY -> x
    DUP3,
    /*kind*/,
    /*new_node*/,
    PUSH1, BUFFER_SIZE_POS,
    MLOAD,

    // Stack contains: newNodeB -> newNodeA -> nodeX -> nodeY -> x
    PUSH1, "01",
    DUP3,
    /*port*/,
    /*enter*/,
    PUSH1, "00"
    DUP2,
    /*port*/,
    /*link*/, // link(enter(port(x,1)), port(b, 0))
    // Stack contains: newNodeB -> newNodeA -> nodeX -> nodeY -> x
    PUSH1, "00",
    DUP5,
    /*port*/,
    PUSH1, "02",
    DUP5,
    /*port*/,
    /*enter*/,
    /*link*/, // link(port(y,0), enter(port(x, 2)))
    // Stack contains: newNodeB -> newNodeA -> nodeX -> nodeY -> x
    PUSH1, "01",
    DUP5,
    /*port*/,
    /*enter*/,
    PUSH, "00",
    DUP4,
    /*port*/,
    /*link*/, //link(enter(port(y,1)), port(a, 0))
    // Stack contains: newNodeB -> newNodeA -> nodeX -> nodeY -> x
    PUSH1, "02",
    DUP5,
    /*port*/,
    /*enter*/,
    PUSH, "00",
    DUP5,
    /*port*/,
    /*link*/, //link(enter(port(y,2)), port(x, 0))

    // Stack contains: newNodeB -> newNodeA -> nodeX -> nodeY -> x
    PUSH, "01"
    DUP3,
    /*port*/,
    PUSH, "01"
    DUP3,
    /*port*/,
    /*link*/, //link(net, port(a, 1), port(b, 1));
    // Stack contains: newNodeB -> newNodeA -> nodeX -> nodeY -> x
    PUSH, "02",
    /*port*/,
    PUSH, "01",
    DUP3,
    /*port*/,
    /*link*/, //link(net, port(x, 1), port(b, 2));
    // Stack contains: newNodeA -> nodeX -> nodeY -> x
    PUSH, "02",
    /*port*/,
    PUSH, "01",
    DUP4,
    /*port*/,
    /*link*/, //link(net, port(a, 2), port(y, 1));
    // Stack contains: nodeX -> nodeY -> x
    PUSH, "02"
    /*port*/,
    PUSH, "02"
    DUP3,
    /*port*/,
    /*link*/, //link(net, port(x, 2), port(y, 2));
    // Stack contains: nodeY -> x
    POP,
    // Stack contains: x

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
