const simpleGit = require('simple-git')

function getProjectGit(path) {
    return simpleGit({
        baseDir: path,
        binary: 'git',
        maxConcurrentProcesses: 6,
        trimmed: false
    })
}

module.exports = {
    getProjectGit
}
