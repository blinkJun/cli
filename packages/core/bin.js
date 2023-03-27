#!/usr/bin/env node
const importLocal = require('import-local')
const log = require('../utils/log')

if (importLocal(__filename)) {
    log.info('本地', '(正在使用的CLI模块来源)')
} else {
    log.info('全局', '(正在使用的CLI模块来源)')
    require('./cli')(process.argv.slice(2))
}
