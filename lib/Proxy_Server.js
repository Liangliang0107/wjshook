const AnyProxy = require('anyproxy');
const payload = require("./payload");
const exec = require('child_process').exec;
const fs = require("fs");
const cheerio = require('cheerio');

// 检查用户是否安装 https 证书
if (!AnyProxy.utils.certMgr.ifRootCAFileExists()) {
    AnyProxy.utils.certMgr.generateRootCA((error, keyPath) => {
        if (!error) {
            const certDir = require('path').dirname(keyPath);
            console.log('The cert is generated at', certDir);
            const isWin = /^win/.test(process.platform);
            if (isWin) {
                exec('start .', {cwd: certDir});
            } else {
                exec('open .', {cwd: certDir});
            }
        } else {
            console.error('error when generating rootCA', error);
        }
    });
}

global.tmpPath = __dirname + "\\temp\\"

if (fs.existsSync(global.tmpPath)) {
    fs.readdirSync(global.tmpPath).map(value => {
        fs.unlinkSync(global.tmpPath + value)
    })
} else {
    fs.mkdirSync(global.tmpPath)
}


function Inject_Js(requestDetail, responseDetail) {
    let FileName;
    let newResponse = Object.assign({}, responseDetail.response);
    requestDetail.url.replace("//", "/").split("/").map(value => {
        if (value.indexOf(".js") !== -1) {
            FileName = value
        }
    })
    if (FileName !== undefined) {
        FileName = FileName.replaceAll("?", "_")
        FileName = FileName.replaceAll("/", "_")
        if (fs.existsSync(global.tmpPath + FileName)) {
            newResponse.body = fs.readFileSync(global.tmpPath + FileName)
            return {
                response: newResponse
            };
        }
    }

    let responseData = responseDetail.response.body.toString();
    try {
        newResponse.body = payload.astExp(requestDetail.url, responseData)
        try {
            FileName !== undefined && fs.writeFileSync(global.tmpPath + FileName, newResponse.body)
        } catch (e) {

        }
        return {
            response: newResponse
        };
    } catch (e) {
        return null;
    }
}

function Inject_Html(requestDetail, responseDetail) {
    let $ = cheerio.load(responseDetail.response.body.toString()),
        newResponse = Object.assign({}, responseDetail.response),
        HToolsCode = fs.readFileSync(__dirname + "\\HTools.js").toString()

    $('head').append("<script>" + HToolsCode + "</script>");
    newResponse.body = $.html();

    return {
        response: newResponse
    };
}

module.exports = {
    Start: function (port) {
        let options = {
            port: port,
            rule: {
                summary: '网页加密算法插桩',
                * beforeSendResponse(requestDetail, responseDetail) {
                    if (responseDetail.response.header['Content-Type'].indexOf("javascript") !== -1) {
                        return Inject_Js(requestDetail, responseDetail);
                    } else if (responseDetail.response.header['Content-Type'].indexOf("text/html") !== -1) {
                        return Inject_Html(requestDetail, responseDetail);
                    }
                    return null;
                }
            },
            webInterface: {
                enable: true,
                webPort: 8002
            },
            throttle: 10000,
            forceProxyHttps: true,
            wsIntercept: false,
            silent: false
        }
        const proxyServer = new AnyProxy.ProxyServer(options);

        proxyServer.on("ready", () => {
            console.log("欢迎使用 网页算法Hook动态插桩脚本 By：liangliang 2035776757");
        });
        proxyServer.on("error", e => {
            console.log(e)
        });
        proxyServer.start();
    }
}