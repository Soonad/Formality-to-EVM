/*
 * Example - Running code on an ethereum-vm
 *
 *
 * To run this example in the browser, bundle this file
 * with browserify using `browserify index.js -o bundle.js`
 * and then load this folder onto a HTTP WebServer (e.g.
 * using node-static or `python -mSimpleHTTPServer`).
 */

/////////// Opcodes ///////////
const STOP          =   "00";
const ADD           =   "01";
const MUL           =   "02";
const SUB           =   "03";
const DIV           =   "04";
const LT            =   "10";
const GT            =   "11";
const EQ            =   "14";
const ISZERO        =   "15";
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
const JUMPI         =   "57";
const PC            =   "58";
const JUMPDEST      =   "5b";
const PUSH1         =   "60";
const PUSH2         =   "61";
const PUSH4         =   "63";
const PUSH8         =   "67";
const PUSH9         =   "68";
const PUSH16        =   "6f";
const PUSH32        =   "7f";
const DUP1          =   "80";
const DUP2          =   "81";
const DUP3          =   "82";
const DUP4          =   "83";
const DUP5          =   "84";
const SWAP1         =   "90";
const SWAP2         =   "91";
const SWAP3         =   "92";

/////////// Important Memory Addresses ///////////
const EXIT_BUFFER_INIT  = "3e00";
const WARP_BUFFER_INIT  = "1f00";
const BUFFER_SIZE_POS   = "1f"; // TODO: Prepare code for receiving 2 bytes instead of 1 with BUFFER_SIZE_POS

/////////// Important constants ///////////
const SLOT_SIZE = "08"; // Hex size, in bytes, of a slot.
const NODE_SIZE = (parseInt(SLOT_SIZE, 16) * 4).toString(16); //Each node has 4 slots

//--Position of the first node in memory. Precalculated for optimization purposes
const FIRST_NODE_POS = (parseInt(BUFFER_SIZE_POS, 16) + parseInt(NODE_SIZE, 16)).toString(16);


/////////// Impotant variables ///////////
var Buffer = require("safe-buffer").Buffer; // use for Node.js <4.5.0
var VM = require("ethereumjs-vm");

// create a new VM instance
var vm = new VM();


/////////// Functions ///////////
// node(node_id) -- Returns the memory position of a node
// gas cost = 14
// PC += 6
var node = [
    // Stack contains: node_id -> x
    // NODE_POSITION = node_id * NODE_SIZE + FIRST_NODE_POS
    PUSH1, NODE_SIZE,
    MUL,
    PUSH1, FIRST_NODE_POS,
    ADD,
    // Stack contains: node_pos -> x
].join("");

// port(node, slot) -- Return a port given a memory index
// A port can be understood as a (node, slot) tuple. A port is calculated by
// abstracting how the network is stored in memory from a format:
// RMem: [NODE0, NODE1, NODE2, ...] where each node has 256 bits and
// VMem: [[SLOT0_0, SLOT1_0, SLOT2_0, KIND0], [SLOT0_1, SLOT1_1, SLOT2_1, KIND1], ...]
// where each slot has 64 bits.
// The 'port' can be understood as a position in this "Virtual Memory" (VMem), which
// is an abstraction of the "Real Memory" (RMem).
//
// ATTENTION: You should NEVER try to MSTORE anything directly in a 'port'. This is
// only an abstraction to make reasoning easier, not an address to be used!
//
// gas cost = 11
// PC += 4
var port = [
    // Stack contains node_id -> slot -> x
    // port = (node_id * 4) + slot
    PUSH1, "04",
    MUL,
    ADD,
    // stack contains port -> x
].join("");

// index(port) -- Calculate the memory position of a port
// gas cost = 20
// PC += 9
var index = [
    // port = (node_id * 4) + slot
    // port's position in real memory (index) = BUFFER_SIZE_POS + (node_id * NODE_SIZE) + ((slot + 1) * SLOT_SIZE)
    // Where NODE_SIZE = 4 * SLOT_SIZE, once each node has 4 slots.

    // This means: port = ((index - BUFFER_SIZE_POS)/SLOT_SIZE) - 1
    // Which leads to: index = ((port + 1) * SLOT_SIZE) + BUFFER_SIZE_POS

    // stack contains port -> x
    PUSH1, "01",
    ADD,
    PUSH1, SLOT_SIZE,
    MUL,
    PUSH1, BUFFER_SIZE_POS,
    ADD,
    // stack contains index -> x
].join("");

// index(node_id, slot) -- Calculate the memory position given node_id and slot
// gas cost = 31
// PC += 13
var index_ns = [
    // port's position in real memory = BUFFER_SIZE_POS + (node_id * NODE_SIZE) + ((slot + 1) * SLOT_SIZE)
    // Implementing this equation directly would result in a gas cost of 34
    // so, we call "port" and "index" functions, resulting in a gas cost of 31
    // Stack contains node_id -> slot -> x
    port,
    index,
    // stack contains index -> x
].join("");

// port_i(index) -- Return a port given a memory index
// gas_cost = 23
// PC += 10
var port_i = [
    // port = (node_id * 4) + slot
    // port's position in abstract memory = BUFFER_SIZE_POS + (node_id * NODE_SIZE) + ((slot + 1) * SLOT_SIZE)
    // This means: port = ((index - BUFFER_SIZE_POS)/SLOT_SIZE) - 1

    // Stack contains index -> x
    PUSH1, SLOT_SIZE,
    PUSH1, BUFFER_SIZE_POS,
    PUSH1, "01",
    // Stack contains 01 -> BUFFER_SIZE_POS -> SLOT_SIZE -> index -> x
    SWAP3,
    // Stack contains index -> BUFFER_SIZE_POS -> SLOT_SIZE -> 01 -> x
    SUB,
    DIV,
    SUB,
    // stack contains port -> x
].join("");

// addr (port) -- Returns the node to which a port belongs
// gas cost = 26 + 6*
// PC += 8
var addr = [
    // Stack contains port -> x
    PUSH1, BUFFER_SIZE_POS,
    SWAP1,
    SUB,
    PUSH1, NODE_SIZE,
    SWAP1,
    DIV,
    // Stack contains: addr -> x
].join("");

// slot(port) -- Returns the slot of a port
// gas cost = 9
// PC += 7
var slot = [
    // Stack contains port -> x
    PUSH1, SLOT_SIZE,
    SWAP1,
    DIV,
    PUSH1, "03", // we just want the last 2 bits
    AND,
].join("");

// enter_i(index) -- returns the value stored in a port index
// gas cost = 3*
// PC += 11
var enter_i = [
    // Stack contains index -> x
    MLOAD,
    PUSH8, "ffffffffffffffff",
    AND, // We only want the last 8 bytes
].join("");

// enter(port) -- returns the value stored in a port
// gas cost = 3*
// PC += 20
var enter = [
    // Stack contains port -> x
    index,
    enter_i,
].join("");

// kind(node) -- Returns the kind of the node
// 0 = era (i.e., a set or a garbage collector)
// 1 = con (i.e., a lambda or an application)
// 2 = fan (i.e., a pair or a let)
// gas cost = 18 + 3*
// PC += 10
var kind = [
    // Stack contains node_id -> x
    node,
    MLOAD,
    PUSH8, "ffffffffffffffff",
    AND,
    // Stack contains kind -> x
].join("");

// new_node(kind) -- Allocates a new node
// gas cost = 63 + 18*
// PC += 79
var new_node = [
    // Stack contains kind -> x
    // get buffer last writable position
    PUSH1, "01",
    PUSH1, BUFFER_SIZE_POS,
    MLOAD,
    PUSH1, "01",
    ADD,
    // Stack contains new_size -> 01 -> kind -> x
    // Update buffer size
    DUP1,
    PUSH1, BUFFER_SIZE_POS,
    MSTORE,

    // Stack contains new_size -> 01 -> kind -> x
    SUB,
    // Stack contains new_node_id -> kind -> x
    SWAP1,

    PUSH1, "02",
    DUP3,
    port,
    PUSH1, "01",
    DUP4,
    port,
    PUSH1, "00",
    DUP5,
    port,
    // Stack contains port0 -> port1 -> port2 -> kind -> new_node_id -> x
    // Write new node ports and kind
    // -- node x, slot 0
    PUSH9, "010000000000000000",
    MUL, // shift left
    ADD,
    // Stack contains port0port1 -> port2 -> kind -> new_node_id -> x
    // -- node x, slot 1
    PUSH9, "010000000000000000",
    MUL, // shift left
    ADD,
    // Stack contains port0port1port2 -> kind -> new_node_id -> x
    // -- node x, slot 2
    PUSH9, "010000000000000000",
    MUL, // shift left
    ADD,
    // Stack contains port0port1port2kind -> new_node_id -> x
    SWAP1,
    node, // get new_node_id memory index
    MSTORE,
    // Stack contains: x
].join("");

// link(portA, portB) -- Links two ports
// gas cost = 6 + 6*
// PC += 100
var link = [
    // Stack contains: portA -> portB -> x
    DUP1, // Duplicate portA
    DUP3, // Duplicate portB
    // Now stack is: PortB -> PortA -> PortA -> PortB -> x
    index,
    SWAP1,
    DUP2,
    // Now stack is: IndexB -> PortA -> IndexB -> PortA -> PortB -> x
    //Treat value to be inserted on IndexB
    MLOAD,
    PUSH32, "ffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000",
    AND, // Erase last 8 bytes
    ADD, // White new value on last 8 bytes
    SWAP1,
    // Now stack is: IndexB -> PortA_modif -> PortA -> PortB -> x
    MSTORE, // mem[PortB] = PortA

    // Now do the same for PortA...

    // Now stack is: PortA -> PortB -> x
    index,
    SWAP1,
    DUP2,
    // Now stack is: IndexA -> PortB -> IndexA -> x
    MLOAD,
    PUSH32, "ffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000",
    AND, // Erase last 8 bytes
    ADD, // White new value on last 8 bytes
    SWAP1,
    // Now stack is: IndexA -> PortB_modif -> x
    MSTORE, // mem[PortA] = PortB
    // Now stack is: x
].join("");

// rewrite(nodeX, nodeY) -- Rewrites an active pair
// gas cost: kind(x) == kind(y) ? (true = 125 + 24*) : (false = 683 + 108*)
// PC += 1554
var rewrite_ = [
    // Stack contains nodeX -> nodeY -> x
    // -- Compare the kind of both nodes
    // PC = X
    DUP2, // PC = X+1
    kind,
    DUP2,
    kind,
    EQ,
    // -- if kinds are equal
    PUSH2, "IndexOfTakenBranch", // <--- Placeholder. Will be replaced later
    PC, // PC = X + 27
    ADD,
    JUMPI, // jump to the other branch
    // -- else, continue...
    // Stack contains: nodeX -> nodeY -> x
    PUSH1, BUFFER_SIZE_POS, // put future newNodeA_id in stack
    MLOAD,
    DUP2,
    kind,
    new_node, // create new node

    // Stack contains: newNodeA -> nodeX -> nodeY -> x
    PUSH1, BUFFER_SIZE_POS, // put future newNodeB_id in stack
    MLOAD,
    DUP4,
    kind,
    new_node, // create new node

    // Stack contains: newNodeB -> newNodeA -> nodeX -> nodeY -> x
    PUSH1, "01",
    DUP4,
    port,
    enter,
    PUSH1, "00",
    DUP3,
    port,
    link, // link(port(b, 0), enter(port(x,1)))

    // Stack contains: newNodeB -> newNodeA -> nodeX -> nodeY -> x
    PUSH1, "00",
    DUP5,
    port,
    PUSH1, "02",
    DUP5,
    port,
    enter,
    link, // link(port(y,0), enter(port(x, 2)))

    // Stack contains: newNodeB -> newNodeA -> nodeX -> nodeY -> x
    PUSH1, "01",
    DUP5,
    port,
    enter,
    PUSH1, "00",
    DUP4,
    port,
    link, //link(enter(port(y,1)), port(a, 0))

    // Stack contains: newNodeB -> newNodeA -> nodeX -> nodeY -> x
    PUSH1, "02",
    DUP5,
    port,
    enter,
    PUSH1, "00",
    DUP5,
    port,
    link, //link(enter(port(y,2)), port(x, 0))

    // Stack contains: newNodeB -> newNodeA -> nodeX -> nodeY -> x
    PUSH1, "01",
    DUP3,
    port,
    PUSH1, "01",
    DUP3,
    port,
    link, //link(net, port(a, 1), port(b, 1));

    // Stack contains: newNodeB -> newNodeA -> nodeX -> nodeY -> x
    PUSH1, "02",
    SWAP1,
    port,
    PUSH1, "01",
    DUP4,
    port,
    link, //link(net, port(x, 1), port(b, 2));

    // Stack contains: newNodeA -> nodeX -> nodeY -> x
    PUSH1, "02",
    SWAP1,
    port,
    PUSH1, "01",
    DUP4,
    port,
    link, //link(net, port(a, 2), port(y, 1));

    // Stack contains: nodeX -> nodeY -> x
    PUSH1, "02",
    SWAP1,
    port,
    SWAP1,
    PUSH1, "02",
    SWAP1,
    port,
    link, //link(net, port(x, 2), port(y, 2));

    // Stack contains: x
    // Jump to end of function
    PUSH2, "IndexOfFunctionEnd", // <--- Placeholder. Will be replaced later. PC = X + 1182
    PC, // PC = END - 313 = X + 1183
    ADD,
    JUMP,

    //=======================================
    /*if (kind(x) == kind(y)) is true, continue from here -- gas cost = ??? */
    // -- Stack contains: nodeX -> nodeY -> x
    JUMPDEST, // <----- Position "IndexOfTakenBranch". PC = END - 310 = X + 1186
    PUSH1, "01",
    DUP2,
    port,
    enter,
    PUSH1, "01",
    DUP4,
    port,
    enter,
    link,
    // -- Stack contains: nodeX -> nodeY -> x
    PUSH1, "02",
    SWAP1,
    port,
    enter,
    SWAP1,
    PUSH1, "02",
    SWAP1,
    port,
    enter,
    link,
    // Stack contains: x
    JUMPDEST, // <------ Position "IndexOfFunctionEnd". PC = END = X + 1496

];
var jumpToTakenBranch = rewrite_.indexOf("IndexOfTakenBranch"); //25
var jumpToFunctionEnd = rewrite_.indexOf("IndexOfFunctionEnd"); //

//TODO find a better way of doing this whithout hardcoding values
var takenBranchBegin = "04B2";
var functionEnd = "0139"

rewrite_[jumpToTakenBranch] = takenBranchBegin;
rewrite_[jumpToFunctionEnd] = functionEnd;

var rewrite = rewrite_.join("");

// push(buffer_init, value) -- Pushes a value to the end of a buffer
// PC += 10
var push = [
    // Stack contains BUFFER_INIT -> VALUE -> x
    // Get buffer size
    DUP1,
    MLOAD,

    // Stack contains BUFFER_LEN -> BUFFER_INIT -> VALUE -> x
    // Add 1 to buffer len and update value in memory
    PUSH1, "01",
    DUP2,
    ADD,
    DUP3,
    MSTORE,

    // Push desired value to buffer
    // Stack contains BUFFER_SIZE -> BUFFER_INIT -> VALUE -> x
    ADD,
    MSTORE,
].join("");

// pop(buffer_init) -- Removes value from the end of a buffer and pushes it to stack
// PC += 10
var pop = [
    // Stack contains BUFFER_INIT -> x
    DUP1,
    MLOAD,

    // Subtract 1 from buffer len and update value in memory
    // Stack contains BUFFER_SIZE -> BUFFER_INIT -> x
    PUSH1, "01",
    DUP2,
    SUB,
    DUP3,
    MSTORE,

    // Push desired value to stack
    // Stack contains BUFFER_SIZE -> BUFFER_INIT -> x
    ADD,
    MLOAD,
].join("");

// NOT WORKING
// reduce() -- Reduces a net to normal form lazily and sequentially.
var reduce_ = [
    // Stack contains: x
    PUSH1, "00",
    PUSH2, WARP_BUFFER_INIT,
    MSTORE, //let mut warp : Vec<u32> = Vec::new();
//6
    PUSH1, "00",
    PUSH2, EXIT_BUFFER_INIT,
    MSTORE,//let mut exit : Vec<u32> = Vec::new();
//12
    // Stack contains: x
    PUSH1, "00", // back = 0
    PUSH1, "00", // prev = 0
    PUSH1, "00", // s = Slot 0
    PUSH1, "00", // n = Node 0
//20
    port,
    enter, // next = enter(port(n, s));
//44
    JUMPDEST, // <----- IndexOfWhileLoopStart = 0x2D = 45
    // Stack contains: next -> prev -> back -> x
    // -- Comparison (next > 0)
    PUSH1, "00",
    DUP2,
    GT,

    // -- Comparison warp.len() > 0
    PUSH2, WARP_BUFFER_INIT,
    MLOAD,
    PUSH1, "00",
    GT,
//56
    OR,
    NOT,
//58
    PUSH2, "IndexOfFunctionEnd",
    PC, //62
    ADD,
    JUMPI, // while next > 0 || warp.len > 0
//64
    // Stack contains: next -> prev -> back -> x
    // if next == 0
    DUP1,
    ISZERO,
    NOT,
    PUSH2, "IndexOfNotTakenBranch_next",
    PC, // 71
    ADD,
    JUMPI,
//73
    // next = enter(net, warp.pop().unwrap())
    // Stack contains: next -> prev -> back -> x
    PUSH2, WARP_BUFFER_INIT,
    pop,
    enter, // Stack contains: next_new -> next_old -> prev -> back -> x
    SWAP1,
    POP,   // // Stack contains: next_new -> prev -> back -> x
//108
    // else, do nothing
    JUMPDEST, // <--- IndexOfNotTakenBranch_next = 0x6D = 109

    // prev = enter(net, next);
    // Stack contains: next -> prev -> back -> x
    DUP1,
    enter,
    SWAP2,
    POP,
//132
    // Stack contains: next -> prev -> back -> x
    // if slot(next) == 0 && slot(prev) == 0 && addr(prev) != 0 {
    DUP2,
    slot,
    ISZERO, // slot(prev) == 0
//141
    DUP2,
    slot,
    ISZERO, // slot(next) == 0
//150
    DUP4,
    addr,
    ISZERO,
    NOT, // addr(prev) != 0
//161
    AND,
    AND,
//163
    NOT,
    PUSH2, "IndexOfNotTakenBranch_if1_while",
    PC, //168
    ADD,
    JUMPI,
//170
    // Stack contains: next -> prev -> back -> x
    // -- back = enter(net, port(addr(prev), exit.pop().unwrap()));
    PUSH2, EXIT_BUFFER_INIT,
    pop, // exit.pop()
//183
    DUP3,
    addr, // addr(prev)
//192
    port,
    enter,
//216
    SWAP3, // back = enter(port(addr(prev), exit.pop()))
    POP,

    // -- rewrite(net, addr(prev), addr(next));
    DUP2,
    addr,
//227
    DUP2,
    addr,
//236
    rewrite, // PC += X = 1554
//236 + X
    // next = enter(net, back);
    DUP3,
    enter,
    SWAP1,
    POP,
    // Stack contains: next_new -> prev -> back -> x
//259 + X
    JUMPDEST, // <---- IndexOfNotTakenBranch_if1_while = 260 + X
    // Stack contains: next -> prev -> back -> x
    // else if slot(next) == 0 {
    DUP1,
    slot,
    ISZERO,
// 269 + X
    NOT,
    PUSH2, "IndexOfNotTakenBranch_if2_while",
    PC, //274 + X
    ADD,
    JUMPI,
// 276+X
    // Stack contains: next -> prev -> back -> x
    // warp.push(port(addr(next), 2));
    PUSH1, "02",
    DUP2,
    addr,
    port,
    PUSH2, WARP_BUFFER_INIT,
    push,
// 304 + X
    // next = enter(net, port(addr(next), 1));
    PUSH1, "01",
    SWAP1,
    addr,
    port,
    enter,
    // Stack contains: next_new -> prev -> back -> x
//339+X
    // else {
    JUMPDEST, // <---- IndexOfNotTakenBranch_if2_while = 336+X
    // Stack contains: next -> prev -> back -> x
    //  exit.push(slot(next));
    DUP1,
    slot,
    PUSH2, EXIT_BUFFER_INIT,
    push,
//360+X
    // next = enter(net, port(addr(next), 0));
    PUSH1, "00",
    SWAP1,
    addr,
    port,
    enter,
//395+X
    PUSH2, "IndexOfWhileLoopStart",
    PC,//399+X
    SUB,
    JUMP,
    JUMPDEST, // <---- IndexOfFunctionEnd = 402+X
// Stack contains: x
];

var jumpToFunctionEnd = reduce_.indexOf("IndexOfFunctionEnd"); //
var jumpToNotTakenBranchNext = reduce_.indexOf("IndexOfNotTakenBranch_next"); //
var jumpToNotTakenBranchIf1While = reduce_.indexOf("IndexOfNotTakenBranch_if1_while"); //
var jumpToNotTakenBranchIf2While = reduce_.indexOf("IndexOfNotTakenBranch_if2_while"); //
var jumpToWhileLoopStart = reduce_.indexOf("IndexOfWhileLoopStart"); //

// TODO find a better way of doing this whithout hardcoding values
// TODO find the correct values for these variables
var IndexOfFunctionEnd = "0766";
var IndexOfNotTakenBranch_next = "0026";
var IndexOfNotTakenBranch_if1_while = "066E";
var IndexOfNotTakenBranch_if2_while = "003E";
var IndexOfWhileLoopStart = "0774";

reduce_[jumpToFunctionEnd] = IndexOfFunctionEnd;
reduce_[jumpToNotTakenBranchNext] = IndexOfNotTakenBranch_next;
reduce_[jumpToNotTakenBranchIf1While] = IndexOfNotTakenBranch_if1_while;
reduce_[jumpToNotTakenBranchIf2While] = IndexOfNotTakenBranch_if2_while;
reduce_[jumpToWhileLoopStart] = IndexOfWhileLoopStart;

var reduce = reduce_.join("");

////////////////////// TESTS //////////////////////
// PASSING
var nodeTest = [
    //should push position of node 0 to stack
    PUSH1, "00",
    node,
    DUP1,
    MLOAD,
    //should push position of node 1 to stack
    PUSH1, "01",
    node,
    DUP1,
    MLOAD,
].join("");

//PASSING
var portTest = [
    PUSH1, "00", // slot 0
    PUSH1, "00", // node 0
    port,
    PUSH1, "03", // slot 3 (kind)
    PUSH1, "00", // node 0
    port,
    PUSH1, "02", // slot 2
    PUSH1, "01", // node 1
    port,
].join("");

//PASSING
var indexTest = [
    PUSH1, "00", // slot 0
    PUSH1, "00", // node 0
    port,
    DUP1,
    index,
    PUSH1, "00", // slot 0
    PUSH1, "00", // node 0
    index_ns,
    PUSH1, "00", // slot 0
    PUSH1, "00", // node 0
    port,
    index,
    port_i,
].join("");

//PASSING
var addrTest = [
    PUSH1, "27", // Node 0
    addr,
    PUSH1, "37", // Node 0
    addr,
    PUSH1, "3f", // Node 1
    addr,
].join("");

//PASSING
var slotTest = [
    PUSH1, "27", // Slot 0
    slot,
    PUSH1, "3f", // Slot 0
    slot,
    PUSH1, "37", // Slot 2
    slot,
].join("");

//PASSING
var enterTest = [
    PUSH1, "00", // node 0
    PUSH1, "00", // slot 0
    index_ns, // index 27
    DUP1,
    enter,
    SWAP1,
    MLOAD,
].join("");

// PASSING
var accordanceTest = [
    PUSH1, "00", // node 0
    PUSH1, "00", // slot 0
    index, // index 27
    PUSH1, "27",
    slot, // slot 0
    PUSH1, "27",
    addr, // node 0
    PUSH1, "27",
    enter, // value on index 27
    PUSH1, "27",
    MLOAD, // index 27 memory vicinity
].join("");

// PASSING
var kindTest = [
    PUSH1, "00",
    kind,
    PUSH1, "01",
    kind,
].join("");

// PASSING
var linkTest = [
    // Before linking:
    PUSH1, "03", // slot 3
    PUSH1, "00", // node 0
    index_ns,
    MLOAD,
    PUSH1, "03", // slot 3
    PUSH1, "01", // node 1
    index_ns,
    MLOAD,

    // Link
    PUSH1, "02", // slot 2
    PUSH1, "00", // node 0
    port,
    PUSH1, "00", // slot 0
    PUSH1, "01", // node 1
    port,
    link,

    // After linking:
    PUSH1, "03", // slot 3
    PUSH1, "00", // node 0
    index_ns,
    MLOAD,
    PUSH1, "03", // slot 3
    PUSH1, "01", // node 1
    index_ns,
    MLOAD,

].join("");

// PASSING
var newNodeTest = [
    PUSH1, "ff", // kind = ff
    new_node, // create new node

    // get new_node_id
    PUSH1, BUFFER_SIZE_POS,
    MLOAD,
    PUSH1, "01",
    SWAP1,
    SUB,
    node,

    // Load new node to stack
    MLOAD,
].join("");

// PASSING
var rewriteTest = [
    // Push nodes contents to stack before rewriting
    PUSH1, "00",
    node,
    MLOAD,

    PUSH1, "01",
    node,
    MLOAD,

    PUSH1, "02",
    node,
    MLOAD,

    // Rewrite
    PC,
    PUSH1, "01", // Node 0
    PUSH1, "02", // Node 1
    rewrite,
    PC,
    // Push nodes contents to stack after rewriting
    PUSH1, "00",
    node,
    MLOAD,

    PUSH1, "01",
    node,
    MLOAD,

    PUSH1, "02",
    node,
    MLOAD,

    PUSH1, "03",
    node,
    MLOAD,

    PUSH1, "04",
    node,
    MLOAD,

    // Push memory size to stack after rewriting
    PUSH1, BUFFER_SIZE_POS,
    MLOAD,
].join("");

// NOT PASSING
var reduceTest = [
    reduce,

    /*PUSH1, "00",
    node,
    MLOAD,

    PUSH1, "01",
    node,
    MLOAD,

    PUSH1, "02",
    node,
    MLOAD,

    PUSH1, "03",
    node,
    MLOAD,

    PUSH1, "04",
    node,
    MLOAD,

    PUSH1, "05",
    node,
    MLOAD,

    PUSH1, "06",
    node,
    MLOAD,

    PUSH1, "07",
    node,
    MLOAD,

    PUSH1, "08",
    node,
    MLOAD,

    PUSH1, "09",
    node,
    MLOAD,*/
].join("");
////////////////////// EVM CODE //////////////////////
var code = [
    // Load SIC graph to memory
    PUSH2, "ffff",
    PUSH1, "00",
    PUSH1, BUFFER_SIZE_POS,
    CALLDATACOPY,

    // Code
    reduceTest,

    // Stop
    STOP
].join("");

var data = [ "0000000000000000000000000000000000000000000000000000000000000003", // size
             "0000000000000000 0000000000000005 0000000000000006 0000000000000001", // node 0
             "0000000000000008 0000000000000001 0000000000000002 0000000000000003", // node 1
             "0000000000000004 0000000000000009 000000000000000a 0000000000000004", // node 2
         ].join('').split(' ').join('');

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
