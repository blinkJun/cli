const log = require('../utils/log')

async function exec(commandName, ...args) {
    const command = require(`../commands/${commandName}/index`)

    // 精简参数
    const params = Object.create(null)
    const cmdOptions = args[args.length - 1]
    for (const key in cmdOptions) {
        if (key.startsWith('_') || key === 'parent') {
            continue
        }
        params[key] = args[key]
    }
    // 覆盖到原参数
    args[args.length - 1] = params

    log.verbose('执行命令：', `${commandName} ${JSON.stringify(args)}`)

    command(args)
}

module.exports = exec
