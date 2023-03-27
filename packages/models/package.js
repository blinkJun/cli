const path = require('path')
const npmInstall = require('npminstall')
const fse = require('fs-extra')

const { formatPath } = require('../utils/utils')
const { getDefaultRegistry, getNpmLatestVersion } = require('../utils/get-npm-info')

// 模块类
// @exmple
// new Package({
//  path:'./',
//  name:'vue',
//  version:'3.0.0'
// })
class Package {
    constructor(options) {
        const { path: installPath, name, version } = options

        this.installPath = installPath
        this.packageName = name
        this.packageVersion = version

        // 缓存到指定目录的 `node_modules` 文件夹下
        if (this.installPath) {
            this.cachePath = path.resolve(this.installPath, 'node_modules')
        }

        // package的模块名称格式化
        this.cachePackagePathPrefix = name.replace(/\//g, '_')

        this.prepare()
    }

    // 直接进行一些准备工作
    async prepare() {
        // 如果传入了安装目录地址但是未创建则创建一个缓存目录
        if (this.installPath && !fse.existsSync(this.cachePath)) {
            fse.mkdirSync(this.cachePath, { recursive: true })
        }
        // 将包的版本格式化为具体版本
        if (this.packageVersion === 'latest') {
            this.packageVersion = await getNpmLatestVersion(this.packageName)
        }
    }

    // 获取缓存模块的具体路径
    getCachePackagePath() {
        return path.resolve(this.cachePath, `_${this.cachePackagePathPrefix}@${this.packageVersion}@${this.packageName}`)
    }

    // 获取具体版本的缓存模块的具体路径
    currentVersionCachePackagePath(version) {
        return path.resolve(this.cachePath, `_${this.cachePackagePathPrefix}@${version}@${this.packageName}`)
    }

    // 是否存在此模块
    async exists() {
        return fse.existsSync(this.installPath)
    }

    // 安装此模块
    async install() {
        // 只会将模块安装到缓存目录
        return npmInstall({
            root: this.installPath,
            storeDir: this.cachePath,
            registry: getDefaultRegistry(),
            pkgs: [
                {
                    name: this.packageName,
                    version: this.packageVersion
                }
            ]
        })
    }

    // 更新此模块
    async update() {
        // 获取此模块最新版本号
        const latestVersion = await getNpmLatestVersion(this.packageName)
        // 是否已经安装此包
        if (!fse.existsSync(this.currentVersionCachePackagePath(latestVersion))) {
            return npmInstall({
                root: this.installPath,
                storeDir: this.cachePath,
                registry: getDefaultRegistry(),
                pkgs: [
                    {
                        name: this.packageName,
                        version: latestVersion
                    }
                ]
            })
        }
    }

    // 获取执行文件具体路径
    getRootFilePath() {
        if (this.exists()) {
            // 读取 package.json
            const pkgFile = require(path.resolve(this.getCachePackagePath, 'package.json'))
            // 读取配置的执行文件
            if (pkgFile && pkgFile.main) {
                // 路径兼容
                return formatPath(path.resolve(this.getCachePackagePath(), pkgFile.main))
            }
        }
        return null
    }
}

module.exports = Package
