const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const types = require("@babel/types");
const fs = require("fs");
const generator = require("@babel/generator").default;

const Debug = false;

let ExpList = [];

fs.readdirSync(__dirname + "\\Plugin").map(value => {
    let Plugin_Path = __dirname + "\\Plugin\\" + value;
    if (Object.keys(require(Plugin_Path)).length !== 0) {
        ExpList.push(require(Plugin_Path))
    }
})

function astExp(url, JsCode) {
    ExpList.map(value => {
        if (url.indexOf(value.url) !== -1) {
            JsCode = value.exp(JsCode)
        }
    })

    function inArr(name) {
        if (name === undefined) return false;
        let nameArr = ['encrypt', 'decrypt',
            "stringify", "parse",
            "MD5", "SHA1", "SHA3", "SHA224", "SHA256", "SHA384", "SHA512", "RIPEMD160",
            "PBKDF2", "EvpKDF",
            "setPublic", "setPrivate", "RSAKeyPair",
            "btoa", "atob"
        ];
        for (let i = 0; i < nameArr.length; i++) {
            if (name.toLowerCase().indexOf(nameArr[i].toLowerCase()) !== -1) {
                return true;
            }
        }
        return false;
    }

    function gen_Node(funcName, body) {

        let _arguments = [
            types.stringLiteral("当前 Hook 函数名称: " + funcName + "   " + "点击展开详细"),
            types.identifier("arguments")]
        body.unshift(types.callExpression(types.identifier("WjsHook_log"), _arguments))
        if (Debug) body.unshift(types.debuggerStatement());  //debugger 插桩
    }


    let ast = parser.parse(JsCode);
    let visitor = {
        StringLiteral(path) {
            delete path.node.extra;
        },
        "ObjectProperty|FunctionDeclaration|AssignmentExpression"(path) {
            let node = path.node;
            if (types.isObjectProperty(path)) {
                let name;
                if (types.isStringLiteral(node.key)) {
                    name = node.key.value;
                } else if (types.isIdentifier(node.key)) {
                    name = node.key.name;
                }
                if (name === ""
                    || !types.isFunctionExpression(node.value)
                    || !inArr(name)) return;
                gen_Node(name, node.value.body.body)
            } else if (types.isFunctionDeclaration(path)) {
                if (node.id === undefined
                    || node.id.name === ""
                    || !inArr(node.id.name)
                ) return;
                gen_Node(node.id.name, node.body.body)
            } else if (types.isAssignmentExpression(node)) {
                let name;
                if (!types.isFunctionExpression(node.right)) return;
                if (types.isMemberExpression(node.left)) {
                    name = generator(node.left).code;
                }
                if (name === ""
                    || !inArr(name)
                ) return;

                gen_Node(name, node.right.body.body)
            }
        }
    }
    traverse(ast, visitor);
    return generator(ast, {jsescOption: {"minimal": true}}).code;
}

module.exports = {
    astExp: astExp
}