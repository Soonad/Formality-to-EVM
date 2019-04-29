var net = require('./net.js');

/*////////////////////// TESTS //////////////////////
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
    PUSH1, "00", // Node 0
    addr,
    PUSH1, "01", // Node 0
    addr,
    PUSH1, "04", // Node 1
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

// DEPRECATED
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
    PUSH1, "01", // Node 0
    PUSH1, "02", // Node 1
    rewrite,

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
*/

// PASSING
var pushTest = [
    // init warp buffer
    net.PUSH1, "00",
    net.PUSH2, net.WARP_BUFFER_INIT,
    net.MSTORE,

    // Push new value
    net.PUSH2, "FEFE",
    net.PUSH2, net.WARP_BUFFER_INIT,
    net.push,

    // Check included value
    net.PUSH2, net.WARP_BUFFER_INIT,
    net.DUP1,
    net.MLOAD,
    net.SWAP1,
    net.PUSH1, net.SLOT_SIZE,
    net.ADD,
    net.MLOAD,
].join("");


// NOT PASSING
var popTest = [
    // init warp buffer
    net.PUSH1, "00",
    net.PUSH2, net.WARP_BUFFER_INIT,
    net.MSTORE,

    // Push new values
    net.PUSH2, "FEFE",
    net.PUSH2, net.WARP_BUFFER_INIT,
    net.push,

    net.PUSH2, "FDFD",
    net.PUSH2, net.WARP_BUFFER_INIT,
    net.push,

    // Pop value we just inserted
    net.PUSH2, net.WARP_BUFFER_INIT,
    net.pop,
    net.PUSH2, net.WARP_BUFFER_INIT,
    net.MLOAD,
].join("");
/*
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
//].join("");

// Test data cases
var case1 =
["0000000000000000000000000000000000000000000000000000000000000003", // size
 "0000000000000009 0000000000000001 0000000000000005 0000000000000001", // node 0
 "000000000000000a 0000000000000002 0000000000000008 0000000000000002", // node 1
 "0000000000000006 0000000000000000 0000000000000004 0000000000000002", // node 2
].join('').split(' ').join('');

var case2 =
["0000000000000000000000000000000000000000000000000000000000000003", // size
 "0000000000000005 0000000000000001 0000000000000006 0000000000000001", // node 0
 "0000000000000008 0000000000000000 0000000000000002 0000000000000003", // node 1
 "0000000000000004 0000000000000009 000000000000000a 0000000000000004", // node 2
].join('').split(' ').join('');

var case3 =
[ "0000000000000000000000000000000000000000000000000000000000000003", // size
  "0000000000000004 0000000000000001 0000000000000005 0000000000000001", // node 0
  "0000000000000000 0000000000000002 0000000000000008 0000000000000003", // node 1
  "0000000000000006 0000000000000009 000000000000000a 0000000000000004", // node 2
].join('').split(' ').join('');


module.exports = {
    // Test Cases
    case1:case1,
    case2:case2,
    case3:case3,

    // Test Functions
    /*nodeTest:nodeTest,
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
    reduceTest:reduceTest,*/
    pushTest:pushTest,
    popTest:popTest,
};
