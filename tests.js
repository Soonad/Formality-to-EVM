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

    net.PUSH1, net.BUFFER_SIZE_POS,
    net.MLOAD,

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

    net.PUSH1, "06",
    net.node,
    net.MLOAD,

    net.PUSH1, "07",
    net.node,
    net.MLOAD,

    net.PUSH1, "08",
    net.node,
    net.MLOAD,

    net.PUSH1, "09",
    net.node,
    net.MLOAD,

    net.PUSH1, "0A",
    net.node,
    net.MLOAD,

    net.PUSH1, "0B",
    net.node,
    net.MLOAD,

    net.PUSH1, "0C",
    net.node,
    net.MLOAD,

    net.PUSH1, "0D",
    net.node,
    net.MLOAD,

    net.PUSH1, "0E",
    net.node,
    net.MLOAD,

    net.PUSH1, "0F",
    net.node,
    net.MLOAD,

    net.PUSH1, "10",
    net.node,
    net.MLOAD,

    net.PUSH1, "11",
    net.node,
    net.MLOAD,
].join("");


var sizeCalc = [

].join("");

// Test data cases

// 2^(2^2)
var case1 =
["0000000000000000000000000000000000000000000000000000000000000011", // size
 "0000000000000004 0000000000000001 0000000000000019 0000000000000001", // node 0
 "0000000000000000 000000000000000C 0000000000000008 0000000000000001", // node 1
 "0000000000000006 0000000000000010 0000000000000014 0000000000000002", // node 2
 "0000000000000005 0000000000000011 0000000000000016 0000000000000001", // node 3
 "0000000000000009 000000000000000D 0000000000000015 0000000000000001", // node 4
 "000000000000000A 0000000000000012 000000000000000E 0000000000000001", // node 5
 "000000000000001C 0000000000000002 0000000000000030 0000000000000001", // node 6
 "0000000000000018 0000000000000024 0000000000000020 0000000000000001", // node 7
 "000000000000001E 0000000000000028 000000000000002C 0000000000000003", // node 8
 "000000000000001D 0000000000000029 000000000000002E 0000000000000001", // node 9
 "0000000000000021 0000000000000025 000000000000002D 0000000000000001", // node 10
 "0000000000000022 000000000000002A 0000000000000026 0000000000000001", // node 11
 "000000000000001A 0000000000000038 0000000000000034 0000000000000001", // node 12
 "0000000000000032 000000000000003C 0000000000000040 0000000000000004", // node 13
 "0000000000000031 000000000000003D 0000000000000042 0000000000000001", // node 14
 "0000000000000035 0000000000000039 0000000000000041 0000000000000001", // node 15
 "0000000000000036 000000000000003E 000000000000003A 0000000000000001", // node 16
].join('').split(' ').join('');

module.exports = {
    // Test Cases
    case1:case1,
    //case2:case2,
    //case3:case3,
    //case4:case4,

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
