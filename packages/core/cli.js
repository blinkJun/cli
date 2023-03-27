const log = require('../utils/log')
const prepare = require('./prepare')
const { registerCommands } = require('./command')

const cli = async function (args) {
    try {
        // 初始化
        await prepare(args)
        // 注册命令
        await registerCommands()
    } catch (error) {
        log.verbose('初始化失败：', error)
        log.error(error.message)
    }
}

module.exports = cli
