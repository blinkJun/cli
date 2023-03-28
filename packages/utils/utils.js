const fs = require('fs')
const cp = require('child_process')
const path = require('path')

const { Spinner } = require('cli-spinner')
/**
 * @method spinnerStart
 * @description 滚动条加载
 * @param {String} spinnerText
 * @param {String} spinnerString
 * @return {spinnerInstance}
 */
const spinnerStart = function (spinnerText = '正在加载...', spinnerString = Spinner.spinners[18]) {
    const spinnerInstance = new Spinner(`${spinnerText} %s`)
    spinnerInstance.setSpinnerString(spinnerString)
    spinnerInstance.start()
    return spinnerInstance
}

// 判断当前执行目录是否为空
function isCwdEmpty(path) {
    let fileList = fs.readdirSync(path)
    fileList = fileList.filter((fileName) => {
        const ignoreList = ['node_modules']
        return !fileName.startsWith('.') && !ignoreList.includes(fileName)
    })
    return !fileList || fileList.length <= 0
}

/**
 * @method execCommand
 * @description spawn win32平台兼容 命令执行
 * @param {String} command
 * @param {Array} args
 * @param {Object} options
 * @return {*} child instance
 */
const execCommand = function (command, args, options) {
    const win32 = process.platform === 'win32'
    const cmd = win32 ? 'cmd' : command
    const cmdArgs = win32 ? ['/c'].concat(command, args) : args

    return cp.spawn(cmd, cmdArgs, options || {})
}

/**
 * @method execCommandAsync
 * @description spawn win32平台兼容 命令执行 异步
 * @param {String} command
 * @param {Array} args
 * @param {Object} options
 * @return {Promise} child status
 */
const execCommandAsync = function (command, args, options) {
    return new Promise((resolve, reject) => {
        const child = execCommand(command, args, options)
        child.on('error', (e) => {
            reject(e)
        })
        child.on('exit', (res) => {
            resolve(res)
        })
    })
}

/**
 * @method getRandomIP
 * @description 生成随机xff头
 * @return {string} xff header
 */
function getRandomIP() {
    return Array.from(Array(3))
        .map(() => parseInt(Math.random() * 255, 10))
        .concat([new Date().getTime() % 255])
        .join('.')
}

/**
 * @method getGitModuleUrl
 * @description 获取可供npm命令下载的链接
 * @param {String} gitUrl
 * @return {String}
 */
function getGitModuleUrl(gitUrl) {
    return `git+${gitUrl}`
}

/**
 * @method formatPath
 * @description 格式化macOS/window上的分隔符
 * @param {String} filterPath 路径
 * @return {String}
 */
function formatPath(filterPath) {
    if (filterPath && typeof filterPath === 'string') {
        // 查看系统分隔符
        const sep = path.sep
        if (sep === '/') {
            return filterPath
        } else {
            return filterPath.replace(/\\/g, '/')
        }
    }
    return filterPath
}

module.exports = {
    spinnerStart,
    isCwdEmpty,
    execCommand,
    execCommandAsync,
    getGitModuleUrl,
    formatPath,
    getRandomIP
}
