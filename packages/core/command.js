const pkg = require('../../package.json')
const log = require('../utils/log')
const colors = require('colors/safe')

const registerCommands = async function () {
    const commander = require('commander')
    const program = commander.program

    program.name(Object.keys(pkg.bin)[0]).version(pkg.version).usage('<command> [options]')

    // 调试模式 执行命令
    program.option('-d, --debug', '是否开启调试模式', false).on('option:debug', () => {
        const { debug } = program.opts()
        if (debug) {
            process.env.LOG_LEVEL = 'verbose'
        } else {
            process.env.LOG_LEVEL = 'info'
        }
        log.level = process.env.LOG_LEVEL
    })

    // 注册命令
    // 命令1：初始化项目
    program
        .command('init')
        .argument('[projectName]', '项目名称')
        .description('初始化项目')
        .option('-f, --force', '是否强制初始化项目，直接清理文件夹下所有内容', false)
        .action(function (...args) {
            const exec = require('./exec')
            exec('init', ...args)
        })

    // 命令2：打标签
    program
        .command('version')
        .argument('[versionType]', '版本类型：major minor patch')
        .option('-p, --push', '是否直接推送至远程', false)
        .description('升级项目版本')
        .action(function (...args) {
            const exec = require('./exec')
            exec('version', ...args)
        })

    // 命令3：压缩图片
    program
        .command('tinyimg')
        .argument('[entryPath]', '指定目录')
        .argument('[outputPath]', '输出目录')
        .option('--deep', '是否递归查找目录中的图片文件', false)
        .description('压缩图片，支持jpg、jpeg、png')
        .action(function (...args) {
            const exec = require('./exec')
            exec('tinyimg', ...args)
        })

    // 监听所有的命令，对未知的命令进行提示
    program.on('command:*', (options) => {
        log.warn(colors.red(`未知的命令：${options[0]}`))

        // 提示可用的命令
        const availableCommands = program.commands.map((cmd) => cmd.name())
        log.info(colors.green('可用命令：' + availableCommands.join(',')))
    })

    // 解析命令
    program.parse(process.argv)
}

module.exports = {
    registerCommands
}
