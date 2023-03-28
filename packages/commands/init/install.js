const path = require('path')
const fse = require('fs-extra')
const AdmZip = require('adm-zip')

const { getNpmLatestVersion } = require('../../utils/get-npm-info')
const { spinnerStart } = require('../../utils/utils')
const { getProjectLatestTag: getGitlabProjectLatestTag, downloadProjectZip: downloadGitlabProjectZip } = require('../../utils/gitlab')
const { getGithubLatestVersion: getGithubProjectLatestTag, downloadProjectZip: downloadGithubProjectZip } = require('../../utils/github')
const { types } = require('./templates')
const Package = require('../../models/package')
const log = require('../../utils/log')

// 下载npm模板
async function installNpmTemplate(cachePath, templatePath, template) {
    const pkg = new Package({
        path: path.resolve(cachePath),
        name: template.npmName,
        version: template.version
    })

    // 安装或者更新
    if (await pkg.exists()) {
        const spinner = spinnerStart('正在更新模板...')
        try {
            await pkg.update()
        } catch (error) {
            throw new Error(error.message)
        } finally {
            spinner.stop(true)
            if (await pkg.exists()) {
                log.success('更新模板成功！')
            }
        }
    } else {
        const spinner = spinnerStart('正在下载模板...')
        try {
            await pkg.install()
        } catch (error) {
            throw new Error(error.message)
        } finally {
            spinner.stop(true)
            if (await pkg.exists()) {
                log.success('下载模板成功！')
                log.verbose('模块缓存路径', templatePath)
            }
        }
    }
    // 复制到模板目录
    fse.copySync(pkg.getCachePackagePath(), templatePath)
}

// 下载 gitlab模板
async function installGitlabTemplate(cachePath, templatePath, template) {
    if (!fse.existsSync(templatePath)) {
        // 下载并缓存模板
        const spinner = spinnerStart('正在下载模板...')
        try {
            // 下载模块
            const fileType = 'zip'
            const { data } = await downloadGitlabProjectZip(template.projectId, template.version, fileType)

            // 解压缩
            const tempalteZip = new AdmZip(data)
            const zipEntries = tempalteZip.getEntries()
            tempalteZip.extractAllTo(cachePath, /*maintainEntryPath*/ true, /*overwrite*/ true)

            // 重命名
            const zipPath = path.resolve(cachePath, zipEntries[0].entryName)
            fse.rename(zipPath, templatePath)
        } catch (error) {
            throw new Error(error.message)
        } finally {
            spinner.stop(true)
            if (fse.existsSync(templatePath)) {
                log.success('下载模板成功！')
                log.verbose('模块缓存路径', templatePath)
            }
        }
    }
}

// 下载 github 模板
async function installGithubTemplate(cachePath, templatePath, template) {
    if (!fse.existsSync(templatePath)) {
        // 下载并缓存模板
        const spinner = spinnerStart('正在下载模板...')
        try {
            // 下载模块
            await downloadGithubProjectZip(template.repoPath, template.version, cachePath, `${template.name}@${template.version}`)
            fse.rename(path.resolve(cachePath, `${template.name}-${template.version.substr(1)}`), templatePath)
        } catch (error) {
            throw new Error(error.message)
        } finally {
            spinner.stop(true)
            if (fse.existsSync(templatePath)) {
                log.success('下载模板成功！')
                log.verbose('模块缓存路径', templatePath)
            }
        }
    }
}

// 将包的版本格式化为具体版本
async function updateToCurrentVersion(template) {
    if (template.version === 'latest') {
        if (template.resType === types.TEMPLATE_TYPE_RES_GITLAB) {
            template.version = await getGitlabProjectLatestTag(template.projectId)
        }

        // 无需更新
        if (template.resType === types.TEMPLATE_TYPE_RES_NPM) {
            template.version = await getNpmLatestVersion(template.npmName)
        }

        if (template.resType === types.TEMPLATE_TYPE_RES_GITHUB) {
            template.version = await getGithubProjectLatestTag(template.repoPath)
        }
    }
}

async function install(template) {
    // 检查模板目录
    const { USER_HOME, CLI_PROJECT_TEMPLATE_PATH } = process.env
    const cachePath = path.resolve(USER_HOME, CLI_PROJECT_TEMPLATE_PATH)
    const templatePath = path.resolve(cachePath, `${template.name}@${template.version}`)

    if (!fse.existsSync(templatePath)) {
        // 从npm源下载
        if (template.resType === types.TEMPLATE_TYPE_RES_NPM) {
            await installNpmTemplate(cachePath, templatePath, template)
        }
        // 从gitlab下载
        if (template.resType === types.TEMPLATE_TYPE_RES_GITLAB) {
            await installGitlabTemplate(cachePath, templatePath, template)
        }
        // 从github下载
        if (template.resType === types.TEMPLATE_TYPE_RES_GITHUB) {
            await installGithubTemplate(cachePath, templatePath, template)
        }
    }
}

module.exports = {
    install,
    updateToCurrentVersion
}
