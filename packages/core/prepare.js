const path = require('path')

const semver = require('semver')
const colors = require('colors')
const { homedir } = require('os')
const fse = require('fs-extra')

const log = require('../utils/log')
const pkg = require('../../package.json')
const defaultEnv = require('./env')

const config = require('../config')
const { getProjectLatestTag } = require('../utils/gitlab')

function checkCliDefaultDir() {
    const { USER_HOME, CLI_PROJECT_TEMPLATE_PATH, CLI_KEYS_PATH } = process.env

    const cachePath = path.resolve(USER_HOME, CLI_PROJECT_TEMPLATE_PATH)
    if (!fse.existsSync(cachePath)) {
        fse.mkdirSync(cachePath, { recursive: true })
    }

    const keysPath = path.resolve(USER_HOME, CLI_KEYS_PATH)
    if (!fse.existsSync(keysPath)) {
        fse.mkdirSync(keysPath, { recursive: true })
    }
}

function checkDebuggerStatus(args) {
    const keys = ['-d', '--debug']
    let isDebugger = false
    for (const key of args) {
        if (keys.includes(key)) {
            isDebugger = true
            break
        }
    }
    if (isDebugger) {
        process.env.LOG_LEVEL = 'verbose'
    } else {
        process.env.LOG_LEVEL = 'info'
    }
    log.level = process.env.LOG_LEVEL
}

// 检查脚手架版本
async function checkCliVersion() {
    const { version, name } = pkg
    log.verbose('当前版本：', `${version}`)
    try {
        const latestVersion = await getProjectLatestTag(config.git.cliProjectId, version)
        log.verbose('最新版本：', `${latestVersion}`)
        // 最新版本大于当前版本则建议更新
        if (latestVersion && semver.gt(latestVersion, version)) {
            log.warn('更新新版本', colors.yellow(`\n请手动更新${name}，当前版本：${version}，最新版本：${latestVersion}。\n更新命令：npm i ${name} --save`))
        }
    } catch (error) {
        log.warn('检查版本失败.', error.message)
        log.verbose(error)
    }
}

// 自动降级用户账户
function checkRootAccount() {
    // 对系统uid降级 root=>普通用户
    const rootCheck = require('root-check')
    rootCheck()
}

// 检查用户主目录是否存在
function checkUserHomePath() {
    const userHome = homedir()
    if (!userHome || !fse.existsSync(userHome)) {
        throw new Error('当前登录用户目录不存在！')
    }
    log.verbose('用户目录：', userHome)
    // 存在则配置到全局
    process.env.USER_HOME = userHome
}

// 配置环境变量
function checkEnv() {
    // 先将配置的默认环境变量配置到全局
    for (const envKey in defaultEnv) {
        if (!process.env[envKey]) {
            process.env[envKey] = defaultEnv[envKey]
        }
    }

    // 检查用户根目录下的环境变量文件
    const envPath = path.resolve(homedir(), '.env')
    // 配置到全局环境变量
    if (fse.existsSync(envPath)) {
        const dotEnv = require('dotenv')
        dotEnv.config({
            path: envPath
        })
    }

    // 输出配置的环境变量
    log.verbose('默认环境变量', defaultEnv)
    log.silly('全部环境变量', process.env)
}

async function prepare(args) {
    checkDebuggerStatus(args)
    checkUserHomePath()
    checkEnv()
    checkCliDefaultDir()
    checkRootAccount()
    await checkCliVersion()
}

module.exports = prepare
