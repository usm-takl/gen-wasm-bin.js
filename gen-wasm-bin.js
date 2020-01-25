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

function makeTypeSec() {
    return [
        0x01, // section id: type section
        0x04, // section size
        [
            0x01, // length of vector
            [ 0x60, 0x00, 0x00 ] // function type
        ]
    ]
}

function makeFuncSec(a) {
    return [
        0x03, // section id: function section
        0x02, // section size
        [
            0x01, // length of vector
            [
                0x00, // function
            ]
        ]
    ];
}

function makeCodeSec(a) {
    return [
        0x0a, // section id: code section
        0x04, // section size
        [
            0x01, // length of vector
            [
                0x02, // size of function body
                0x00, // count of local decl
                0x0b, // end
            ]
        ]
    ];
}

const bufferSource = u8tree2u8array([
    makeMagic(),
    makeVersion(),
    makeTypeSec(),
    makeFuncSec(),
    makeCodeSec()
]);

const importObject = {};
WebAssembly.instantiate(bufferSource, importObject).then(x => {
    console.log(x)
});
