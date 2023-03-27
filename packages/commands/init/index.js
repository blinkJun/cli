const path = require('path')
const fse = require('fs-extra')
const inquirer = require('inquirer')
const semver = require('semver')
const kebabCase = require('kebabcase')
const glob = require('glob')
const ejs = require('ejs')

const log = require('../../utils/log')
const { spinnerStart, isCwdEmpty, execCommandAsync } = require('../../utils/utils')
const { install: installTempalte, updateToCurrentVersion } = require('./install')

const { templates } = require('./templates')

// 安装项目的路径
let projectPath

// 准备阶段
async function prepare(projectName, params) {
    // 带项目名称，直接新建文件夹
    if (projectName) {
        projectPath = path.resolve(projectPath, projectName)

        if (!fse.pathExistsSync(projectPath)) {
            fse.mkdirSync(projectPath)
        }
    }

    // 检查文件夹是否为空,是否需要清空文件夹
    if (!isCwdEmpty(projectPath)) {
        // 是否强制安装
        if (!params.force) {
            const answer = await inquirer.prompt({
                type: 'confirm',
                name: 'continue',
                default: false,
                message: '当前文件夹不为空，是否继续创建项目？'
            })
            if (!answer.continue) {
                return false
            }
        }
        // 二次询问
        const answer = await inquirer.prompt({
            type: 'confirm',
            name: 'continue',
            default: false,
            message: '清空后不可恢复，请确认是否清空当前目录？'
        })
        if (answer.continue) {
            const spinner = spinnerStart('正在清空文件目录...')
            fse.emptyDirSync(projectPath)
            spinner.stop(true)
        } else {
            return false
        }
    }
    return true
}

// 获取项目的详细信息
async function getProjectInfo(projectName) {
    if (templates.length <= 0) {
        throw new Error('暂无项目模板')
    }
    const projectInfo = await inquirer.prompt([
        {
            type: 'input',
            name: 'appName',
            message: '请输入项目名称',
            default: projectName || path.parse(process.cwd()).name,
            validate: function (value) {
                const done = this.async()
                setTimeout(() => {
                    // 验证
                    // 1，首字符必须为字母
                    // 2，尾字符必须为数字或字母
                    // 3，只能用 - 特殊字符连接
                    if (!/^[a-zA-Z]+[\w-]*[a-zA-Z0-9]$/.test(value)) {
                        done('请输入合法的项目名称')
                    }
                    done(null, true)
                }, 0)
            }
        },
        {
            type: 'input',
            name: 'version',
            message: '请输入项目版本号',
            default: '1.0.0',
            validate: function (value) {
                const done = this.async()
                setTimeout(() => {
                    // 验证
                    if (!semver.valid(value)) {
                        done('请输入合法的版本号，如：v1.0.0')
                    }
                    done(null, true)
                }, 0)
                return
            },
            filter: (value) => {
                if (semver.valid(value)) {
                    // 格式化
                    return semver.valid(value)
                } else {
                    return value
                }
            }
        },
        {
            type: 'input',
            name: 'description',
            message: '请输入项目描述',
            default: '',
            validate: function (value) {
                const done = this.async()
                setTimeout(() => {
                    // 验证
                    if (!value) {
                        done('请输入项目描述')
                    }
                    done(null, true)
                }, 0)
            }
        },
        {
            type: 'list',
            name: 'template',
            message: '请选择项目模板',
            choices: templates.map((template) => {
                return {
                    value: template.projectId,
                    name: template.name
                }
            }),
            filter: function (value) {
                return templates.find((template) => template.projectId === value)
            }
        }
    ])

    if (projectInfo) {
        projectInfo.appName = kebabCase(projectInfo.appName).replace(/^-/, '')
    }
    return projectInfo
}

// 填充变量
async function renderTemplateValiable(projectInfo) {
    const spinner = spinnerStart('正在替换模板变量...')
    return new Promise((resolve, reject) => {
        glob(
            '**',
            {
                cwd: projectPath,
                ignore: ['node_modules/**', 'public/**'],
                nodir: true
            },
            (err, matches) => {
                if (err) {
                    spinner.stop(true)
                    log.error('替换模板变量失败！')
                    reject(err)
                }
                Promise.all(
                    matches.map((filePath) => {
                        return new Promise((resolve, reject) => {
                            const fileCurrentPath = path.resolve(projectPath, filePath)
                            ejs.renderFile(fileCurrentPath, projectInfo, {})
                                .then((renderedFile) => {
                                    fse.writeFile(fileCurrentPath, renderedFile)
                                    resolve(renderedFile)
                                })
                                .catch((err) => {
                                    reject(err)
                                })
                        })
                    })
                )
                    .then(() => {
                        spinner.stop(true)
                        log.success('替换模板变量成功！')
                        resolve()
                    })
                    .catch((err) => {
                        spinner.stop(true)
                        log.error('替换模板变量失败！')
                        reject(err)
                    })
            }
        )
    })
}

async function init([projectName, params]) {
    projectPath = process.cwd()
    log.verbose('安装路径', projectPath)

    const prepareSuccess = await prepare(projectName, params)
    if (!prepareSuccess) {
        return false
    }

    const projectInfo = await getProjectInfo(projectName)
    if (!projectInfo) {
        return false
    }

    const template = projectInfo.template

    await updateToCurrentVersion(template)

    // 检查模板目录
    const { USER_HOME, CLI_PROJECT_TEMPLATE_PATH } = process.env
    const cachePath = path.resolve(USER_HOME, CLI_PROJECT_TEMPLATE_PATH)
    const templatePath = path.resolve(cachePath, `${template.name}@${template.version}`)

    // 下载模板到缓存目录
    await installTempalte(projectInfo.template)

    // 将模板复制到指定目录
    const spinner = spinnerStart('正在安装标准模板...')
    fse.copySync(templatePath, projectPath)
    spinner.stop(true)

    // 替换模板中的变量
    await renderTemplateValiable(projectInfo)

    const { installCommand, serveCommand } = projectInfo.template

    // 安装依赖
    if (installCommand) {
        log.notice('开始依赖安装')
        const args = installCommand.split(' ')
        const command = args[0]
        const commandArgs = args.slice(1)
        const ret = await execCommandAsync(command, commandArgs, {
            cwd: projectPath,
            stdio: 'inherit'
        })
        if (ret !== 0) {
            throw new Error('安装依赖失败！')
        } else {
            log.success('依赖安装成功！')
        }
    } else {
        throw new Error('无依赖安装命令:installCommand')
    }

    // 启动服务
    if (serveCommand) {
        log.notice('开始启动本地服务')
        const args = serveCommand.split(' ')
        const command = args[0]
        const commandArgs = args.slice(1)
        const ret = await execCommandAsync(command, commandArgs, {
            cwd: projectPath,
            stdio: 'inherit'
        })
        if (ret !== 0) {
            throw new Error('启动本地服务失败！')
        }
    } else {
        throw new Error('无本地服务启动命令:serveCommand')
    }
}

module.exports = init
