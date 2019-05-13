var net = require('./net.js');

////////////////////// TESTS //////////////////////
// PASSING
var nodeTest = [
    //should push position of node 0 to stack
    net.PUSH1, "00",
    net.node,
    net.DUP1,
    net.MLOAD,
    //should push position of node 1 to stack
    net.PUSH1, "01",
    net.node,
    net.DUP1,
    net.MLOAD,
    //should push position of node 2 to stack
    net.PUSH1, "02",
    net.node,
    net.DUP1,
    net.MLOAD,
].join("");

//PASSING
var portTest = [
    net.PUSH1, "00", // slot 0
    net.PUSH1, "00", // node 0
    net.port,
    net.PUSH1, "03", // slot 3 (kind)
    net.PUSH1, "00", // node 0
    net.port,
    net.PUSH1, "02", // slot 2
    net.PUSH1, "01", // node 1
    net.port,
    net.PUSH1, "02", // slot 2
    net.PUSH1, "02", // node 2
    net.port,
].join("");

//PASSING
var indexTest = [
    net.PUSH1, "03", // slot 0
    net.PUSH1, "00", // node 0
    net.port,
    net.DUP1,
    net.index,
    net.PUSH1, "03", // slot 0
    net.PUSH1, "00", // node 0
    net.index_ns,
    net.PUSH1, "03", // slot 0
    net.PUSH1, "00", // node 0
    net.port,
    net.index,
    net.port_i,
].join("");

//PASSING
var addrTest = [
    net.PUSH1, "00", // Node 0
    net.addr,
    net.PUSH1, "01", // Node 0
    net.addr,
    net.PUSH1, "04", // Node 1
    net.addr,
].join("");

//PASSING
var slotTest = [
    net.PUSH1, "01", // Slot 1
    net.PUSH1, "00", // Node 0
    net.port,
    net.slot,
    net.PUSH1, "02", // Slot 2
    net.PUSH1, "01", // Node 1
    net.port,
    net.slot,
    net.PUSH1, "00", // Slot 0
    net.PUSH1, "02", // Node 2
    net.port,
    net.slot,
    net.PUSH1, "03", // Slot 3 (kind)
    net.PUSH1, "02", // Node 2
    net.port,
    net.slot,
].join("");

//PASSING
var enterTest = [
    net.PUSH1, "00", // node 0
    net.PUSH1, "00", // slot 0
    net.port,
    net.DUP1,
    net.enter,
].join("");

// DEPRECATED
/*var accordanceTest = [
    PUSH1, "00", // node 0
    index, // index 27
    PUSH1, "27",
    slot, // slot 0
    PUSH1, "27",
    addr, // node 0
    PUSH1, "27",
    enter, // value on index 27
    PUSH1, "27",
    MLOAD, // index 27 memory vicinity
].join("");*/

// PASSING
var kindTest = [
    net.PUSH1, "00",
    net.kind,
    net.PUSH1, "01",
    net.kind,
].join("");

// PASSING
var linkTest = [
    // Before linking:
    net.PUSH1, "03", // slot 3
    net.PUSH1, "00", // node 0
    net.index_ns,
    net.MLOAD,
    net.PUSH1, "03", // slot 3
    net.PUSH1, "01", // node 1
    net.index_ns,
    net.MLOAD,

    // Link
    net.PUSH1, "02", // slot 2
    net.PUSH1, "00", // node 0
    net.port,
    net.PUSH1, "00", // slot 0
    net.PUSH1, "01", // node 1
    net.port,
    net.link,

    // After linking:
    net.PUSH1, "03", // slot 3
    net.PUSH1, "00", // node 0
    net.index_ns,
    net.MLOAD,
    net.PUSH1, "03", // slot 3
    net.PUSH1, "01", // node 1
    net.index_ns,
    net.MLOAD,

].join("");

// PASSING
var newNodeTest = [
    net.PUSH1, "ff", // kind = ff
    net.new_node, // create new node

    // get new_node_id
    net.PUSH1, net.BUFFER_SIZE_POS,
    net.MLOAD,
    net.PUSH1, "01",
    net.SWAP1,
    net.SUB,
    net.node,

    // Load new node to stack
    net.MLOAD,
].join("");

// PASSING
var rewriteTest = [
    // Push nodes contents to stack before rewriting
    net.PUSH1, "00",
    net.node,
    net.MLOAD,

    net.PUSH1, "01",
    net.node,
    net.MLOAD,

    net.PUSH1, "02",
    net.node,
    net.MLOAD,

    // Rewrite
    net.PUSH1, "01", // Node 1
    net.PUSH1, "02", // Node 2
    net.rewrite,

    // Push nodes contents to stack after rewriting
    net.PUSH1, "00",
    net.node,
    net.MLOAD,

    net.PUSH1, "01",
    net.node,
    net.MLOAD,

    net.PUSH1, "02",
    net.node,
    net.MLOAD,

    net.PUSH1, "03",
    net.node,
    net.MLOAD,

    net.PUSH1, "04",
    net.node,
    net.MLOAD,

    net.PUSH1, "05",
    net.node,
    net.MLOAD,

    // Push memory size to stack after rewriting
    net.PUSH1, net.BUFFER_SIZE_POS,
    net.MLOAD,
].join("");

// PASSING
var pushTest = [
    // init warp buffer
    net.PUSH1, "00",
    net.PUSH2, net.EXIT_BUFFER_INIT,
    net.MSTORE,

    // Push new values
    net.PUSH2, "FEFE",
    net.PUSH2, net.EXIT_BUFFER_INIT,
    net.push,

    net.PUSH2, "FDFD",
    net.PUSH2, net.EXIT_BUFFER_INIT,
    net.push,

    net.PUSH2, "FCFC",
    net.PUSH2, net.EXIT_BUFFER_INIT,
    net.push,

    // Check included value
    net.PUSH2, net.EXIT_BUFFER_INIT,
    net.DUP1,
    net.MLOAD,
    net.SWAP1,
    net.PUSH1, net.SLOT_SIZE,
    net.PUSH1, "03",
    net.MUL,
    net.ADD,
    net.MLOAD,
].join("");


// PASSING
var popTest = [
    // init warp buffer
    net.PUSH1, "00",
    net.PUSH2, net.EXIT_BUFFER_INIT,
    net.MSTORE,

    // Push new values
    net.PUSH2, "FEFE",
    net.PUSH2, net.EXIT_BUFFER_INIT,
    net.push,

    net.PUSH2, net.EXIT_BUFFER_INIT,
    net.MLOAD,

    net.PUSH2, "FDFD",
    net.PUSH2, net.EXIT_BUFFER_INIT,
    net.push,

    net.PUSH2, net.EXIT_BUFFER_INIT,
    net.MLOAD,

    net.PUSH2, net.EXIT_BUFFER_INIT,
    net.pop,

    net.PUSH2, net.EXIT_BUFFER_INIT,
    net.MLOAD,

    net.PUSH2, "FCFC",
    net.PUSH2, net.EXIT_BUFFER_INIT,
    net.push,

    net.PUSH2, net.EXIT_BUFFER_INIT,
    net.MLOAD,

    net.PUSH2, net.EXIT_BUFFER_INIT,
    net.pop,

    net.PUSH2, net.EXIT_BUFFER_INIT,
    net.MLOAD,

    net.PUSH2, net.EXIT_BUFFER_INIT,
    net.pop,

    net.PUSH2, net.EXIT_BUFFER_INIT,
    net.MLOAD,
].join("");

// NOT PASSING
var reduceTest = [
    net.reduce,

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


var sizeCalc = [

].join("");

// Test data cases
var case1 =
["0000000000000000000000000000000000000000000000000000000000000003", // size
 "0000000000000005 0000000000000001 0000000000000006 0000000000000001", // node 0
 "0000000000000008 0000000000000000 0000000000000002 0000000000000002", // node 1
 "0000000000000004 0000000000000009 000000000000000a 0000000000000003", // node 2
].join('').split(' ').join('');

var case2 =
["0000000000000000000000000000000000000000000000000000000000000003", // size
 "0000000000000005 0000000000000001 0000000000000006 0000000000000001", // node 0
 "0000000000000008 0000000000000000 0000000000000002 0000000000000002", // node 1
 "0000000000000004 0000000000000009 000000000000000a 0000000000000003", // node 2
].join('').split(' ').join('');

var case3 =
[ "0000000000000000000000000000000000000000000000000000000000000003", // size
  "0000000000000004 0000000000000001 0000000000000005 0000000000000001", // node 0
  "0000000000000000 0000000000000002 0000000000000008 0000000000000003", // node 1
  "0000000000000006 0000000000000009 000000000000000a 0000000000000004", // node 2
].join('').split(' ').join('');

var case4 =
[ "0000000000000000000000000000000000000000000000000000000000000002", // size
  "0000000000000004 0000000000000001 0000000000000005 0000000000000001", // node 0
  "0000000000000000 0000000000000002 0000000000000006 0000000000000001", // node 1
].join('').split(' ').join('');

module.exports = {
    // Test Cases
    case1:case1,
    case2:case2,
    case3:case3,
    case4:case4,

    // Test Functions
    nodeTest:nodeTest,
    portTest:portTest,
    indexTest:indexTest,
    addrTest:addrTest,
    slotTest:slotTest,
    enterTest:enterTest,
    kindTest:kindTest,
    linkTest:linkTest,
    newNodeTest:newNodeTest,
    rewriteTest:rewriteTest,
    pushTest:pushTest,
    popTest:popTest,
    reduceTest:reduceTest,
};
