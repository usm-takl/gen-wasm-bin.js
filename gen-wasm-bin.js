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

function makeSection(id, body) {
    return [id, countLeaves(body), body];
}

function makeFuncType(f) {
    return [ 0x60, makeVec(f.param), makeVec(f.result) ];
}

function makeTypeSec(fs) {
    const body = makeVec(fs.map(makeFuncType));
    return makeSection(0x01, body);
}

function makeFuncSec(a) {
    const body = makeVec([[0x00]]);
    return makeSection(0x03, body);
}

function makeExport(name, typeid, index) {
    return [ makeString(name), typeid, index ];
}

function makeFuncExport(name, index) {
    return makeExport(name, 0x00, index)
}

function makeExportSec(fs) {
    const body = makeVec(fs.map((f, i) => f.exported ? makeFuncExport(f.name, i) : null).filter(x => x));
    return makeSection(0x07, body);
}

function makeCodeSec(a) {
    const body = makeVec([[0x02, 0x00, 0x0b]]);
    return makeSection(0x0a, body);
}

const functions = [
    {
        exported: true,
        name: "a",
        param: [],
        result: [],
        locals: [],
        code: []
    }
];

const bufferSource = u8tree2u8array([
    makeMagic(),
    makeVersion(),
    makeTypeSec(functions),
    makeFuncSec(),
    makeExportSec(functions),
    makeCodeSec()
]);

const importObject = {};

WebAssembly.instantiate(bufferSource, importObject).then(x => {
    console.log(x.instance.exports.a())
});
