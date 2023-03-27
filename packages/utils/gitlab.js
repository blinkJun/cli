const path = require('path')

const log = require('./log')
const semver = require('semver')
const inquirer = require('inquirer')
const fse = require('fs-extra')
const { Gitlab } = require('@gitbeaker/node')

// 创建gitlab实例
async function getGitlabInstance() {
    // 查看是否存在gitlab配置
    const { USER_HOME, CLI_KEYS_PATH } = process.env
    const configPath = path.resolve(USER_HOME, CLI_KEYS_PATH, 'gitlab-token.json')

    // 无token配置则进入创建环节并设置为默认
    if (!fse.existsSync(configPath)) {
        await createGitlabConfig()
    }

    // 使用默认的地址和token
    const { host, token } = require(configPath).default

    return new Gitlab({
        host: host,
        token: token
    })
}

// 创建一个gitlab配置
async function createGitlabConfig() {
    // 创建配置
    const { USER_HOME, CLI_KEYS_PATH } = process.env
    const configPath = path.resolve(USER_HOME, CLI_KEYS_PATH, 'gitlab-token.json')

    const config = {}

    // 创建 token
    const { token, host } = await inquirer.prompt([
        {
            type: 'input',
            name: 'host',
            message: '请输入 gitlab 平台地址，如：http://git.gxucreate.com',
            validate: function (value) {
                const done = this.async()
                setTimeout(() => {
                    // 验证
                    if (!value) {
                        done('请填写 gitlab 平台地址 !')
                    }
                    done(null, true)
                }, 0)
            }
        },
        {
            type: 'input',
            name: 'token',
            message: '请填写 gitlab：access-token (用于请求git模块信息,请在 gitlab -> 个人设置 -> Access Tokens 中创建后粘贴至此处)',
            validate: function (value) {
                const done = this.async()
                setTimeout(() => {
                    // 验证
                    if (!value) {
                        done('请填写 gitlab：access-token !')
                    }
                    done(null, true)
                }, 0)
            }
        }
    ])

    config[host] = token

    config.default = {
        host: host,
        token: token
    }

    fse.writeFileSync(configPath, JSON.stringify(config, null, 2))
}

// 准备 gitlab 实例
let gitlabApi = null
async function prepareGitlab() {
    if (!gitlabApi) {
        gitlabApi = await getGitlabInstance()
    }
}

async function getProjectTags(projectId, baseTag) {
    await prepareGitlab()
    try {
        const tags = await gitlabApi.Tags.all(projectId)
        const sortVersions = tags
            .map((item) => item.name)
            .sort((a, b) => {
                return semver.gt(a, b) ? -1 : 1
            })
        if (baseTag) {
            return sortVersions.filter((version) => {
                return semver.gte(version, baseTag)
            })
        } else {
            return sortVersions
        }
    } catch (error) {
        log.verbose(__filename, error.message)
        log.error(__filename, '获取项目标签失败！')
        return []
    }
}

async function getProjectLatestTag(projectId, baseTag) {
    const tags = await getProjectTags(projectId, baseTag)
    if (tags && tags.length > 0) {
        return tags[0]
    } else {
        return baseTag
    }
}

async function downloadProjectZip(projectId, tag, fileType = 'zip') {
    await prepareGitlab()
    const data = await gitlabApi.Repositories.showArchive(projectId, {
        fileType,
        sha: tag
    })
    return {
        fileType,
        data
    }
}

module.exports = {
    getProjectTags,
    getProjectLatestTag,
    downloadProjectZip
}
