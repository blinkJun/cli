const { log } = require('../utils/log')
const semver = require('semver')
const colors = require('colors')

class Command {
    constructor(args) {
        if (!args) {
            throw new Error('命令参数不能为空！')
        }
        if (!Array.isArray(args)) {
            throw new Error('命令参数不是数组！')
        }
        if (args.length === 0) {
            throw new Error('参数列表为空！')
        }

        // 若命令为 init packageA packageB --force --debug

        // 参数：[packageA,packageB]
        const formatArgs = args.slice(0, args.length - 1)

        // 命令参数 { force:true, debug:true }
        const params = args[args.length - 2]

        this.args = formatArgs
        this.params = params

        this.run()
    }

    async run() {
        try {
            await Promise.resolve()
            // 检查最小node版本
            // await this.checkNodeVersion()
            // 实例命令自己的初始化
            await this.init()
            // 实例命令执行
            await this.exec()
        } catch (error) {
            log.error(error.message)
        }
    }

    async checkNodeVersion() {
        const currentVersion = process.version
        if (semver.gt(this.lowestNodeVersion, currentVersion)) {
            throw new Error(colors.red(`此命令需要的最低node版本为：${this.lowestNodeVersion}`))
        }
    }

    init() {
        throw new Error('请实现命令的init（初始化）方法.')
    }

    exec() {
        throw new Error('请实现命令的exec（执行）方法.')
    }
}

module.exports = Command
