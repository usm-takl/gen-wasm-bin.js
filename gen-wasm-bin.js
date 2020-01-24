const bufferSource = Uint8Array.of(0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00);
const importObject = {};
WebAssembly.instantiate(bufferSource, importObject).then(x => {
    console.log(x)
});
