function WjsHook_log() {
    console.groupCollapsed(arguments[0]);
    for (let i = 0; i < arguments[1].length; i++) {
        console.log("参数%d: ", i, arguments[1][i]);
    }
    console.trace();
    console.groupEnd();
}