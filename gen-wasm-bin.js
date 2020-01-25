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

function makeI32(i) {
    if (i < 0) {
        if (-0x00000040 <= i) return i & 0x7f;
        if (-0x00002000 <= i) return [0x80 | (i & 0x7f), (i >> 7) & 0x7f];
        if (-0x00100000 <= i) return [0x80 | (i & 0x7f), 0x80 | ((i >> 7) & 0x7f), (i >> 14) & 0x7f];
        if (-0x08000000 <= i) return [0x80 | (i & 0x7f), 0x80 | ((i >> 7) & 0x7f), 0x80 | ((i >> 14) & 0x7f), (i >> 21) & 0x7f];
        return [0x80 | (i & 0x7f), 0x80 | ((i >> 7) & 0x7f), 0x80 | ((i >> 14) & 0x7f), 0x80 | ((i >> 21) & 0x7f), (i >> 28) & 0x7f];
    } else {
        if (i < 0x00000040) return i;
        if (i < 0x00002000) return [0x80 | (i & 0x7f), i >> 7];
        if (i < 0x00100000) return [0x80 | (i & 0x7f), 0x80 | ((i >> 7) & 0x7f), i >> 14];
        if (i < 0x08000000) return [0x80 | (i & 0x7f), 0x80 | ((i >> 7) & 0x7f), 0x80 | ((i >> 14) & 0x7f), i >> 21];
        return [0x80 | (i & 0x7f), 0x80 | ((i >> 7) & 0x7f), 0x80 | ((i >> 14) & 0x7f), 0x80 | ((i >> 21) & 0x7f), i >> 28 ];
    }
}

function makeU32(i) {
    if (i < 0x00000080) return i;
    if (i < 0x00004000) return [0x80 | (i & 0x7f), i >> 7];
    if (i < 0x00200000) return [0x80 | (i & 0x7f), 0x80 | ((i >> 7) & 0x7f), i >> 14];
    if (i < 0x10000000) return [0x80 | (i & 0x7f), 0x80 | ((i >> 7) & 0x7f), 0x80 | ((i >> 14) & 0x7f), i >> 21];
    return [0x80 | (i & 0x7f), 0x80 | ((i >> 7) & 0x7f), 0x80 | ((i >> 14) & 0x7f), 0x80 | ((i >> 21) & 0x7f), i >> 28 ];
}

function makeMagic() {
    return [ 0x00, 0x61, 0x73, 0x6d ]; // '\0asm'
}

function makeVersion() {
    return [ 0x01, 0x00, 0x00, 0x00 ];
}

function makeVec(v) {
    return [ makeU32(v.length), v ];
}

function makeString(s) {
    return [ makeU32(s.length), Array.from(s, ch => ch.charCodeAt(0))]
}

function makeSection(id, body) {
    return [id, makeU32(countLeaves(body)), body];
}

function makeFuncType(f) {
    return [ 0x60, makeVec(f.param), makeVec(f.result) ];
}

function makeTypeSec(fs) {
    const body = makeVec(fs.map(makeFuncType));
    return makeSection(0x01, body);
}

function makeFuncImport(f, typeIndex) {
    return [ makeString(f.module), makeString(f.name), 0x00, typeIndex ];
}

function makeImportSec(fs) {
    const body = makeVec(fs.map((f, i) => f.module ? makeFuncImport(f, i) : null).filter(x => x));
    return makeSection(0x02, body);
}

function makeFuncSec(fs) {
    const body = makeVec(fs.map((f, i) => f.module ? null : [i]).filter(x => x));
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

function makeCode(f) {
    const locals = makeVec(f.locals);
    const body = [f.code, 0x0b];
    return [ countLeaves(locals) + countLeaves(body), locals, body];
}

function makeCodeSec(fs) {
    const body = makeVec(fs.map(f => f.module ? null : makeCode(f)).filter(x => x));
    return makeSection(0x0a, body)
}

const functions = [
    {
        module: "x",
        name: "y",
        param: [],
        result: []
    },
    {
        exported: true,
        name: "aa",
        param: [],
        result: [],
        locals: [],
        code: [0x10, 0x00] // (call the 0th function)
    }
]

const bufferSource = u8tree2u8array([
    makeMagic(),
    makeVersion(),
    makeTypeSec(functions),
    makeImportSec(functions),
    makeFuncSec(functions),
    makeExportSec(functions),
    makeCodeSec(functions)
]);

const importObject = {
    x: {
        y: () => console.log("OK")
    }
};

WebAssembly.instantiate(bufferSource, importObject).then(x => {
    x.instance.exports.aa()
});
