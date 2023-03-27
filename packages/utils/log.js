const log = require('npmlog')

// 当环境变量中存在设置的等级时，优先使用
log.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info'
// 默认头部文案
log.heading = 'blink-cli'
// 头部样式
log.headingStyle = {
    fg: 'white',
    bg: 'cyan',
    bold: true
}

log.addLevel('success', 2000, {
    fg: 'white',
    bg: 'green',
    bold: true
})

module.exports = log
