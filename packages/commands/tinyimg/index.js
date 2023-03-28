const https = require('https')
const path = require('path')
const fs = require('fs')
const colors = require('colors/safe')

const Command = require('../../models/command')
const log = require('../../utils/log')
const { getRandomIP, formatPath } = require('../../utils/utils')

const MAX_SIZE = 5000000
const EXTS = ['.jpg', 'jpeg', '.png']

/**
 * @method getTinyCompressResult
 * @description 上传文件并得到压缩结果
 * @param {String} filePath
 * @return {Object} 压缩结果
 */
function getTinyCompressResult(filePath) {
    const requestParams = {
        method: 'POST',
        hostname: 'tinypng.com',
        path: '/backend/opt/shrink',
        headers: {
            rejectUnauthorized: false,
            'X-Forwarded-For': getRandomIP(),
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 ' + '(KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36'
        }
    }
    return new Promise((resolve, reject) => {
        const req = https.request(requestParams, (res) => {
            res.on('data', (buffer) => {
                const postInfo = JSON.parse(buffer.toString())
                if (postInfo.error) {
                    reject(new Error(`压缩失败！\n 当前文件：${filePath} \n ${postInfo.message}`))
                } else {
                    resolve(postInfo)
                }
            })
        })
        req.write(fs.readFileSync(filePath), 'binary')
        req.on('error', (e) => {
            reject(new Error(`请求错误! \n 当前文件：${filePath} \n,${e.message}`))
        })
        req.end()
    })
}

/**
 * @method tinyCompression
 * @description 通过tinypng压缩图片
 * @param {String} entryImgPath
 * @param {String} outputPath
 */
async function tinyCompression(entryImgPath, outputPath) {
    log.verbose('tinypng', `入口文件：${entryImgPath}`)
    log.verbose('tinypng', `输出文件：${outputPath}`)
    const compressResult = await getTinyCompressResult(entryImgPath)

    // 下载压缩后的文件
    const options = new URL(compressResult.output.url)
    const req = https.request(options, (res) => {
        let body = ''
        res.setEncoding('binary')
        res.on('data', (data) => (body += data))
        res.on('end', () => {
            fs.writeFile(outputPath, body, 'binary', (err) => {
                if (err) {
                    return log.error(err.message)
                }
                const path = colors.bold(entryImgPath)
                const origin = colors.gray(`${(compressResult.input.size / 1024).toFixed(2)}KB`)
                const compress = colors.green(`${(compressResult.output.size / 1024).toFixed(2)}KB`)
                const percent = colors.yellow(`${((1 - compressResult.output.ratio) * 100).toFixed(2)}%`)
                log.success(`${path}：${origin} => ${compress} (${percent})`)
            })
        })
    })
    req.on('error', (e) => log.error(e.message))
    req.end()
}

class TinyImgCommand extends Command {
    // 初始化
    init() {
        // 图片所在路径
        this.entryPath = this.args[0]
        // 图片导出路径
        this.outputPath = this.args[1]
    }

    // 执行命令
    async exec(imgEntryPath = path.resolve(process.cwd(), this.entryPath || './'), deep = true) {
        try {
            let imgOutputPath = path.resolve(process.cwd(), this.outputPath || './')
            if (!fs.existsSync(imgEntryPath)) {
                throw new Error(`目录不存在：${imgEntryPath}`)
            }
            // 是不是文件夹
            const stats = fs.statSync(imgEntryPath)
            if (!stats.isDirectory()) {
                if (stats.isFile() && stats.size < MAX_SIZE && EXTS.includes(path.extname(imgEntryPath))) {
                    // 生成输出文件路径
                    imgOutputPath = path.resolve(imgOutputPath, formatPath(imgEntryPath).split('/').reverse()[0])

                    tinyCompression(imgEntryPath, imgOutputPath)
                }
            } else {
                // 递归执行
                if (deep) {
                    fs.readdirSync(imgEntryPath).forEach((filePath) => {
                        this.exec(path.resolve(imgEntryPath, filePath), this.params.deep)
                    })
                }
            }
        } catch (err) {
            log.error(err.message)
        }
    }
}

function exec(...args) {
    // 初始化
    return new TinyImgCommand(...args)
}

module.exports = exec
