const axios = require('axios')
const semver = require('semver')
const https = require('https')
const download = require('download')
const log = require('./log')
const baseUrl = 'https://api.github.com'

const ignoreSSL = axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: false
    })
})

async function downloadProjectZip(repoPath, verison, targetPath) {
    const link = `https://codeload.github.com/${repoPath}/zip/refs/tags/${verison}`
    log.verbose(link)
    return download(link, targetPath, { extract: true })
}

async function getRepoTags(repoPath) {
    return ignoreSSL
        .get(`${baseUrl}/repos/${repoPath}/tags`)
        .then((response) => {
            if (response.status === 200) {
                return response.data
            } else {
                return null
            }
        })
        .catch((err) => {
            return Promise.reject(err)
        })
}

// 获取大于基准版本的版本号列表
async function getGithubGtVersions(repoPath, baseVersion) {
    const tags = await getRepoTags(repoPath)
    const versions = tags.map((item) => item.name)
    const sortVersions = versions.sort((a, b) => {
        return semver.gt(a, b) ? -1 : 1
    })
    if (baseVersion) {
        return sortVersions.filter((version) => {
            return semver.gte(version, baseVersion)
        })
    } else {
        return sortVersions
    }
}
// 获取最新的版本号
async function getGithubLatestVersion(repoPath, baseVersion) {
    const gtVersions = await getGithubGtVersions(repoPath, baseVersion)
    if (gtVersions.length > 0) {
        return gtVersions[0]
    } else {
        return baseVersion
    }
}

module.exports = {
    getGithubLatestVersion,
    downloadProjectZip
}
