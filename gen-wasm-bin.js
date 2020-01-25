function countLeaves(body) {
    let length = 0;
    for (b of body) {
        if (b instanceof Array) length += countLeaves(b);
        else length += 1;
    }
    return length;
}

function u8tree2u8array(tree) {
    const a = new Uint8Array(countLeaves(tree));
    function emit(node, i) {
        for (child of node) {
            if (child instanceof Array) i = emit(child, i);
            else a[i++] = child;
        }
        return i;
    }
    emit(tree, 0);
    return a;
}

function makeMagic() {
    return [ 0x00, 0x61, 0x73, 0x6d ]; // '\0asm'
}

function makeVersion() {
    return [ 0x01, 0x00, 0x00, 0x00 ];
}

function makeVec(v) {
    return [ v.length, v ];
}

function makeString(s) {
    return [ s.length, Array.from(s, ch => ch.charCodeAt(0))]
}

function makeTypeSec() {
    return [
        0x01, // section id: type section
        0x04, // section size
        makeVec([[ 0x60, 0x00, 0x00 ]])
    ]
}

function makeFuncSec(a) {
    return [
        0x03, // section id: function section
        0x02, // section size
        makeVec([[0x00]])
    ];
}

function makeExportSec(a) {
    return [
        0x07, // section id: export section
        0x05, // section size
        makeVec([[makeString("a"), 0x00, 0x00]])
    ]
}

function makeCodeSec(a) {
    return [
        0x0a, // section id: code section
        0x04, // section size
        makeVec([[0x02, 0x00, 0x0b]])
    ];
}

const bufferSource = u8tree2u8array([
    makeMagic(),
    makeVersion(),
    makeTypeSec(),
    makeFuncSec(),
    makeExportSec(),
    makeCodeSec()
]);

const importObject = {};

WebAssembly.instantiate(bufferSource, importObject).then(x => {
    console.log(x.instance.exports.a())
});
