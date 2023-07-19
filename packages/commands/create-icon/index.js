const Command = require('../../models/command')
const { favicons } = require('favicons')
const fsp = require('fs/promises')
const fs = require('fs')
const path = require('path')
const log = require('../../utils/log')
const { spinnerStart } = require('../../utils/utils')
class CreateIconCommand extends Command {
    // 初始化
    init() {
        // 图片资源路径
        this.sourcePath = this.args[0]
        // 图片导出路径
        this.outputPath = this.args[1]
    }
    // 执行
    async exec() {
        const src = path.resolve(process.cwd(), this.sourcePath) // Icon source file path.
        const dest = path.resolve(process.cwd(), this.outputPath || './') // Output directory path.
        if (!fs.existsSync(src)) {
            throw new Error(`资源文件不存在：${src}`)
        }
        if (!fs.existsSync(dest)) {
            throw new Error(`导出目录不存在：${dest}`)
        }

        const spinner = spinnerStart('正在生成...')
        try {
            const response = await favicons(src, {
                icons: {
                    android: false, // Create Android homescreen icon. `boolean` or `{ offset, background }` or an array of sources
                    appleIcon: false, // Create Apple touch icons. `boolean` or `{ offset, background }` or an array of sources
                    appleStartup: false, // Create Apple startup images. `boolean` or `{ offset, background }` or an array of sources
                    favicons: ['favicon.ico'], // Create regular favicons. `boolean` or `{ offset, background }` or an array of sources
                    windows: false, // Create Windows 8 tile icons. `boolean` or `{ offset, background }` or an array of sources
                    yandex: false // Create Yandex browser icon. `boolean` or `{ offset, background }` or an array of sources
                }
            })
            await fsp.mkdir(dest, { recursive: true })
            await Promise.all(response.images.map(async (image) => await fsp.writeFile(path.join(dest, image.name), image.contents)))
            spinner.stop(true)
            log.success('生成成功！', dest)
        } catch (error) {
            spinner.stop(true)
            log.error('生成失败!', error.message)
        }
    }
}

function exec(...args) {
    // 初始化
    return new CreateIconCommand(...args)
}

module.exports = exec
