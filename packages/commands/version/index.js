const path = require('path')
const inquirer = require('inquirer')
const semver = require('semver')

const { getProjectGit } = require('../../utils/git')
const log = require('../../utils/log')
const { execCommandAsync, spinnerStart } = require('../../utils/utils')

const versionUpdateTypes = [
    {
        name: '更新大版本',
        type: 'major',
        command: 'npm version major'
    },
    {
        name: '更新功能',
        type: 'minor',
        command: 'npm version minor'
    },
    {
        name: '修复补丁',
        type: 'patch',
        command: 'npm version patch'
    }
]

async function version([commandVersionType, params]) {
    log.notice('即将为当前项目更新版本，请确保代码保存提交完毕。')

    const projectPath = process.cwd()
    const pkgJsonPath = path.resolve(projectPath, 'package.json')
    const projectGit = getProjectGit(projectPath)

    const { version: projectVersion } = require(pkgJsonPath)
    log.warn('当前项目版本(package.json)为：', projectVersion)

    // 检查 package.json 的版本是否标准
    let currentVersion = null
    const pkgVerison = semver.valid(projectVersion)
    if (pkgVerison) {
        currentVersion = pkgVerison
    } else {
        log.warn('当前版本号(package.json)不规范！')
    }

    // 检查使用tag作为版本号
    let tagVersion = null
    if (!pkgVerison) {
        // 查询tag作为版本
        const projectTag = await projectGit.tags()
        log.warn('当前项目版本(tag)为：', projectTag.latest)
        currentVersion = tagVersion = semver.valid(projectTag.latest)
        if (!tagVersion) {
            log.warn('当前版本号(tag)不规范！')
            // tag的版本号也不规范，则设置为默认版本号
            currentVersion = 'v1.0.0'
        }
    }

    // 使用默认版本号，无需选择类型
    let nextVersion = currentVersion
    if (pkgVerison || tagVersion) {
        // 选择更新类型
        let versionType
        if (commandVersionType) {
            versionType = versionUpdateTypes.find((item) => item.type === commandVersionType)
        } else {
            const { selectedVersionType } = await inquirer.prompt({
                type: 'list',
                name: 'selectedVersionType',
                message: '请选择更新版本类型',
                choices: versionUpdateTypes.map((item) => {
                    return {
                        value: item.type,
                        name: item.name
                    }
                }),
                filter: function (value) {
                    return versionUpdateTypes.find((item) => item.type === value)
                }
            })
            versionType = selectedVersionType
        }

        if (!versionType) {
            throw new Error('无匹配的版本更新类型！')
        }
        log.verbose('version', versionType)

        nextVersion = `v${semver.inc(currentVersion, versionType.type)}`

        // 如果 pkg 的版本号规范则使用默认的更新版本方式
        if (pkgVerison) {
            // 更新 pkg 版本号同时更新 tag 版本号
            const updateCommand = versionType.command
            if (updateCommand) {
                const args = updateCommand.split(' ')
                const command = args[0]
                const commandArgs = args.slice(1)
                const ret = await execCommandAsync(command, commandArgs, {
                    cwd: projectPath,
                    stdio: 'pipe'
                })
                if (ret !== 0) {
                    throw new Error('执行更新命令失败！')
                }
            } else {
                throw new Error('此更新类型暂无更新命令！')
            }
        } else {
            // 只更新 tag 版本号
            await projectGit.tag([nextVersion])
        }
    } else {
        // 直接更新默认版本号
        await projectGit.tag([nextVersion])
    }

    log.success('更新版本为：', nextVersion)

    // 版本推送至远程
    let pushToOrigin = params.push
    if (!pushToOrigin) {
        const answer = await inquirer.prompt({
            type: 'confirm',
            name: 'continue',
            default: true,
            message: `是否将 ${nextVersion} 推送至远程？`
        })
        pushToOrigin = answer.continue
    }
    if (pushToOrigin) {
        const spinner = spinnerStart('正在推送版本...')
        const currentBranch = await projectGit.revparse(['--abbrev-ref', 'HEAD'])
        try {
            if (pkgVerison) {
                // 推送分支 和 版本标签
                await Promise.all([projectGit.push('origin', `${nextVersion}`), projectGit.push('origin', currentBranch)])
            } else {
                // 只需要推送版本标签
                await projectGit.push('origin', `${nextVersion}`)
            }
            spinner.stop(true)
            log.success(`已将 ${nextVersion} 推送至远程 `)
        } catch (error) {
            spinner.stop(true)
            log.error('推送失败！', error.message)
        }
    } else {
        log.notice('需要单独推送版本，请使用：', `git push origin ${nextVersion}`)
        log.success('版本更新完毕.')
    }
}

module.exports = version
