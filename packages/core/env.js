// 设置全局可用的环境变量

// 存放位置
const CLI_HOME_PATH = '.blink-cli'
// 脚手架依赖安装位置
const CLI_DEPENDENCIES_PATH = `${CLI_HOME_PATH}/dependencies`
// 项目模板存放位置
const CLI_PROJECT_TEMPLATE_PATH = `${CLI_HOME_PATH}/template`
// 密钥存放位置
const CLI_KEYS_PATH = `${CLI_HOME_PATH}/keys`

module.exports = {
    CLI_HOME_PATH,
    CLI_DEPENDENCIES_PATH,
    CLI_PROJECT_TEMPLATE_PATH,
    CLI_KEYS_PATH
}
