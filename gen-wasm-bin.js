const bufferSource = Uint8Array.of();
const importObject = {};
WebAssembly.instantiate(bufferSource, importObject).then(x => {
    console.log(x)
});
