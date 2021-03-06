/////////// Opcodes ///////////
const STOP          =   "00";
const ADD           =   "01";
const MUL           =   "02";
const SUB           =   "03";
const DIV           =   "04";
const LT            =   "10";
const GT            =   "11";
const SLT           =   "12";
const SGT           =   "13";
const EQ            =   "14";
const ISZERO        =   "15"; // Can also work as a logical NOT
const AND           =   "16";
const OR            =   "17";
const XOR           =   "18";
//const NOT           =   "19"; // Bitwise NOT
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
const SWAP4         =   "93";

/////////// Important Memory Addresses ///////////
const EXIT_BUFFER_INIT  = "8000";
const WARP_BUFFER_INIT  = "4000";
const BUFFER_SIZE_POS   = "80"; // TODO: Prepare code for receiving 2 bytes instead of 1 with BUFFER_SIZE_POS
const LOOP_COUNT = "00";
const REWRITE_COUNT = "40";

/////////// Important constants ///////////
const SLOT_SIZE = "08"; // Hex size, in bytes, of a slot.
const NODE_SIZE = (parseInt(SLOT_SIZE, 16) * 4).toString(16); //Each node has 4 slots

//--Position of the first node in memory. Precalculated for optimization purposes
const FIRST_NODE_POS = (parseInt(BUFFER_SIZE_POS, 16) + parseInt(NODE_SIZE, 16)).toString(16);


/////////// Functions ///////////

// node(node_id) -> node_index -- Returns the memory position of a node
// gas cost = 14
// PC += 6
const node = [
    // Stack contains: node_id -> x
    // NODE_POSITION = node_id * NODE_SIZE + FIRST_NODE_POS
    PUSH1, NODE_SIZE,
    MUL,
    PUSH1, FIRST_NODE_POS,
    ADD,
    // Stack contains: node_index -> x
].join("");

// port(node, slot) -- Return a port given a node-slot pair
// A port can be understood as a (node, slot) tuple. It is calculated by
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
const port = [
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
const index = [
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
const index_ns = [
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
const port_i = [
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
const addr = [
    // Stack contains port -> x
    PUSH1, "04",
    SWAP1,
    DIV,
    // TODO: Remove placeholders. They were put here only to avoid
    // changing the JUMP's adresses
    JUMPDEST, // Placeholder
    JUMPDEST, // Placeholder
    JUMPDEST, // Placeholder
    JUMPDEST, // Placeholder
    // Stack contains: addr -> x
].join("");

// slot(port) -- Returns the slot of a port
// gas cost = 9
// PC += 7
const slot = [
    // Stack contains port -> x
    /*PUSH1, SLOT_SIZE,
    SWAP1,
    DIV,*/
    PUSH1, "03", // we just want the last 2 bits
    AND,
    // TODO: Remove placeholders. They were put here only to avoid
    // changing the JUMP's adresses
    JUMPDEST, // Placeholder
    JUMPDEST, // Placeholder
    JUMPDEST, // Placeholder
    JUMPDEST, // Placeholder
    // Stack contains: slot -> x
].join("");

// enter_i(index) -- returns the value stored in a port index
// gas cost = 3*
// PC += 11
const enter_i = [
    // Stack contains index -> x
    MLOAD,
    PUSH8, "ffffffffffffffff",
    AND, // We only want the last 8 bytes
].join("");

// enter(port) -- returns the value stored in a port
// gas cost = 3*
// PC += 20
const enter = [
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
const kind = [
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
const new_node = [
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
const link = [
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

// inc(target_index) -- increase memory index's value by 1
// PC += 7
const inc = [
    // Stack contains: target_index -> x
    DUP1,
    MLOAD,
    PUSH1, "01",
    ADD,
    SWAP1,
    MSTORE,
].join("");

// rewrite(nodeX, nodeY) -- Rewrites an active pair
// gas cost: kind(x) == kind(y) ? (true = 125 + 24*) : (false = 683 + 108*)
// PC += 1563
var rewrite_ = [
    // Update statistics
    PUSH1, REWRITE_COUNT,
    inc,

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
    // -- else, kinds are different. Continue...
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

const rewrite = rewrite_.join("");

// len(buffer_init) -- Returns buffer len
// PC += 11
const len = [
    // Stack contains BUFFER_INIT -> x
    MLOAD,
    PUSH8, "ffffffffffffffff",
    AND,
].join("");

// push(buffer_init, value) -- Pushes a value to the end of a buffer
// PC += 62
const push = [
    // Stack contains BUFFER_INIT -> VALUE -> x
    // Get buffer len
    DUP1,
    len,

    // Stack contains BUFFER_LEN -> BUFFER_INIT -> VALUE -> x
    // Update buffer len
    PUSH1, "01",
    ADD,
    DUP1,
    DUP3,
    MSTORE,

    // Push desired value to buffer
    // Stack contains BUFFER_LEN+1 -> BUFFER_INIT -> VALUE -> x
    PUSH1, SLOT_SIZE,
    MUL,
    ADD,

    // Stack contains NEW_VALUE_ADDRESS -> VALUE -> x
    // Where NEW_VALUE_ADDRESS = BUFFER_INIT+((BUFFER_LEN+1)*SLOT_SIZE)
    SWAP1,
    DUP2,
    MLOAD,
    PUSH32, "ffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000",
    AND, // "Clean" memory old value
    ADD, // Put new value in place
    SWAP1,
    MSTORE, // Store new value without affecting other memory regions
].join("");

// pop(buffer_init) -- Removes value from the end of a buffer and pushes it to stack
// PC += 33
const pop = [
    // Stack contains BUFFER_INIT -> x
    DUP1,
    len,

    // Subtract 1 from buffer len and update value in memory
    // Stack contains BUFFER_LEN -> BUFFER_INIT -> x
    PUSH1, "01",
    DUP2,
    SUB,
    DUP3,
    MSTORE,

    // Push last value to stack
    // Stack contains BUFFER_LEN -> BUFFER_INIT -> x
    PUSH1, SLOT_SIZE,
    MUL,
    ADD,
    MLOAD,
    PUSH8, "ffffffffffffffff",
    AND,
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
 //20
    PUSH1, "00", // s = Slot 0
    PUSH1, "00", // n = Node 0
    port,
    enter, // next = enter(port(n, s));
 //44
    JUMPDEST, // <----- IndexOfWhileLoopStart, PC = 0x2D = 45
    // while next > 0 || warp.len > 0

    // Stack contains: next -> prev -> back -> x
    // -- Comparison (next > 0)
    PUSH1, "00",
    DUP2,
    GT,

    // -- Comparison warp.len() > 0
    PUSH1, "00",
    PUSH2, WARP_BUFFER_INIT,
    MLOAD,
    GT,
 //56
    OR,
    ISZERO,
 //58
    PUSH2, "IndexOfFunctionEnd",
    PC, //62
    ADD,
    JUMPI, // while check
 //64
    // Stack contains: next -> prev -> back -> x

    // Update statistics
    PUSH1, LOOP_COUNT,
    inc,

    // if next == 0
    DUP1,
    ISZERO, // TODO: Remove both ISZERO's from here as they
    ISZERO, // work as 2 consecutive logical NOT's
    PUSH2, "IndexOfNotTakenBranch_next",
    PC, // 71
    ADD,
    JUMPI,
 //73
    // next = enter(warp.pop())
    // Stack contains: next -> prev -> back -> x
    PUSH2, WARP_BUFFER_INIT,
    pop,
    enter, // Stack contains: next_new -> next_old -> prev -> back -> x
    SWAP1,
    POP,   // // Stack contains: next_new -> prev -> back -> x
 //131
    // else, do nothing
    JUMPDEST, // <--- IndexOfNotTakenBranch_next, PC = 0x6D = 132

    // prev = enter(next);
    // Stack contains: next -> prev -> back -> x
    DUP1,
    enter,
    SWAP2,
    POP,
 //155
    // Stack contains: next -> prev -> back -> x
    // if slot(next) == 0 && slot(prev) == 0 && addr(prev) != 0 {
    DUP2,
    slot,
    ISZERO, // slot(prev) == 0
 //164
    DUP2,
    slot,
    ISZERO, // slot(next) == 0
 //173
    DUP4,
    addr, // addr(prev) != 0
    ISZERO, // TODO: Remove these 2 consecutive ISZERO's as they are equivalent
    ISZERO, // to negating the same expression twice.
 //184
    AND,
    AND,
 //186
    ISZERO,
    PUSH2, "IndexOfNotTakenBranch_if1_while",
    PC, //191
    ADD,
    JUMPI,
 //193
    // Stack contains: next -> prev -> back -> x
    // -- back = enter(port(addr(prev), exit.pop()));
    PUSH2, EXIT_BUFFER_INIT,
    pop, // exit.pop()
 //229
    DUP3,
    addr, // addr(prev)
 //238
    port,
    enter,
 //262
    SWAP3, // back = enter(port(addr(prev), exit.pop()))
    POP,

    // -- rewrite(addr(prev), addr(next));
    DUP1,
    addr, // addr(next)
 //273
    DUP3,
    addr, //addr(prev)
 //282
    rewrite, // PC += X = 1563
 //282 + X
    // Stack contains: next -> prev -> back -> x
    // next = enter(back);
    DUP3,
    enter,
    SWAP1,
    POP,
    // Stack contains: next=enter(back) -> prev -> back -> x
    // Jump to loop begin
    PUSH2, "IndexOfWhileLoopBegin_if1_while",
    PC, // PC = 309+X
    SUB,
    JUMP,
 //311 + X
    JUMPDEST, // <---- IndexOfNotTakenBranch_if1_while, PC = 312 + X
    // Stack contains: next -> prev -> back -> x
    // else if slot(next) == 0 {
    DUP1,
    slot,
    ISZERO, // TODO: Remove both ISZERO's as the work as 2 consecutive logical NOT's
 // 321 + X
    ISZERO,
    PUSH2, "IndexOfNotTakenBranch_if2_while",
    PC, //326 + X
    ADD,
    JUMPI,
 // 328+X
    // Stack contains: next -> prev -> back -> x
    // warp.push(port(addr(next), 2));
    PUSH1, "02",
    DUP2,
    addr,
    port,
    PUSH2, WARP_BUFFER_INIT,
    push,
 // 408 + X
    // next = enter(port(addr(next), 1));
    PUSH1, "01",
    SWAP1,
    addr,
    port,
    enter,
 // 443 + X
    // Stack contains: next_new -> prev -> back -> x
    // Jump to loop begin
    PUSH2, "IndexOfWhileLoopBegin_if2_while",
    PC, // 447 + X
    SUB,
    JUMP,
 //449+X
    // else {
    JUMPDEST, // <---- IndexOfNotTakenBranch_if2_while, PC = 450+X
    // Stack contains: next -> prev -> back -> x
    //  exit.push(slot(next));
    DUP1,
    slot,
    PUSH2, EXIT_BUFFER_INIT,
    push,
 //511+X
    // next = enter(port(addr(next), 0));
    PUSH1, "00",
    SWAP1,
    addr,
    port,
    enter,
//546+X

 //555+X
    PUSH2, "IndexOfWhileLoopBegin_else_while",
    PC,//558+X
    SUB,
    JUMP,

    JUMPDEST, // <---- IndexOfFunctionEnd, PC = 561+X
    POP,
    POP,
    POP,
 // Stack contains: x
];

var jumpToFunctionEnd = reduce_.indexOf("IndexOfFunctionEnd"); //
var jumpToNotTakenBranchNext = reduce_.indexOf("IndexOfNotTakenBranch_next"); //
var jumpToNotTakenBranchIf1While = reduce_.indexOf("IndexOfNotTakenBranch_if1_while"); //
var jumpToNotTakenBranchIf2While = reduce_.indexOf("IndexOfNotTakenBranch_if2_while"); //
var jumpToWhileLoopBeginElseWhile = reduce_.indexOf("IndexOfWhileLoopBegin_else_while"); //
var jumpToWhileLoopBeginIf1While = reduce_.indexOf("IndexOfWhileLoopBegin_if1_while");
var jumpToWhileLoopBeginIf2While = reduce_.indexOf("IndexOfWhileLoopBegin_if2_while");

// TODO find a better way of doing this whithout hardcoding values
// TODO find the correct values for these variables
var IndexOfFunctionEnd = "081A";//"080E"//"07FC"; // "07D4";
var IndexOfNotTakenBranch_next = "003D";//"0033";
var IndexOfNotTakenBranch_if1_while = "0693";//"068D";//"0684";//"067A";
var IndexOfNotTakenBranch_if2_while = "007C";//"006C";
var IndexOfWhileLoopBeginElseWhile = "0828";//"081C";//"080A";//"07E2";
var IndexOfWhileLoopBeginIf1While = "072B";
var IndexOfWhileLoopBeginIf2While = "07B5";

reduce_[jumpToFunctionEnd] = IndexOfFunctionEnd;
reduce_[jumpToNotTakenBranchNext] = IndexOfNotTakenBranch_next;
reduce_[jumpToNotTakenBranchIf1While] = IndexOfNotTakenBranch_if1_while;
reduce_[jumpToNotTakenBranchIf2While] = IndexOfNotTakenBranch_if2_while;
reduce_[jumpToWhileLoopBeginElseWhile] = IndexOfWhileLoopBeginElseWhile;
reduce_[jumpToWhileLoopBeginIf1While] = IndexOfWhileLoopBeginIf1While;
reduce_[jumpToWhileLoopBeginIf2While] = IndexOfWhileLoopBeginIf2While;

const reduce = reduce_.join("");



module.exports = {
    // OPCODES
    STOP:STOP,
    ADD:ADD,
    MUL:MUL,
    SUB:SUB,
    DIV:DIV,
    LT:LT,
    GT:GT,
    SLT:SLT,
    SGT:SGT,
    EQ:EQ,
    ISZERO:ISZERO,
    AND:AND,
    OR:OR,
    XOR:XOR,
    CALLDATACOPY:CALLDATACOPY,
    POP:POP,
    MLOAD:MLOAD,
    MSTORE:MSTORE,
    MSTORE8:MSTORE8,
    JUMP:JUMP,
    JUMPI:JUMPI,
    PC:PC,
    JUMPDEST:JUMPDEST,
    PUSH1:PUSH1,
    PUSH2:PUSH2,
    PUSH4:PUSH4,
    PUSH8:PUSH8,
    PUSH16:PUSH16,
    PUSH32:PUSH32,
    DUP1:DUP1,
    DUP2:DUP2,
    DUP3:DUP3,
    DUP4:DUP4,
    DUP5:DUP5,
    SWAP1:SWAP1,
    SWAP2:SWAP2,
    SWAP3:SWAP3,
    SWAP4:SWAP4,

    // Constants
    EXIT_BUFFER_INIT:EXIT_BUFFER_INIT,
    WARP_BUFFER_INIT:WARP_BUFFER_INIT,
    BUFFER_SIZE_POS:BUFFER_SIZE_POS,
    SLOT_SIZE:SLOT_SIZE,
    NODE_SIZE:NODE_SIZE,
    FIRST_NODE_POS:FIRST_NODE_POS,
    LOOP_COUNT:LOOP_COUNT,
    REWRITE_COUNT:REWRITE_COUNT,

    //Functions
    node:node,
    port:port,
    index:index,
    index_ns:index_ns,
    port_i:port_i,
    addr:addr,
    slot:slot,
    enter_i:enter_i,
    enter:enter,
    kind:kind,
    new_node:new_node,
    link:link,
    inc:inc,
    rewrite:rewrite,
    push:push,
    pop:pop,
    reduce:reduce,
};
