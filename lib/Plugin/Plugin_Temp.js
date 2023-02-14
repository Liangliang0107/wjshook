function exp(JsCode) {
    JsCode += "Console.log('我是插件功能')"
    return JsCode;
}

module.exports = {
    url: "",  // 针对某个url生效  填空 全部生效
    exp: exp  // 这个exp是 处理函数
}