const TEMPLATE_TYPE_RES_NPM = 'npm'
const TEMPLATE_TYPE_RES_GITLAB = 'gitlab'
const TEMPLATE_TYPE_RES_GITHUB = 'github'

const TEMPLATE_TYPE_NORMAL = 'normal'
const TEMPLATE_TYPE_COSTUM = 'custom'

module.exports = {
    templates: [
        {
            name: 'Hawk-Admin',
            repoPath: 'blinkJun/Hawk-Admin',
            version: 'latest',
            resType: TEMPLATE_TYPE_RES_GITHUB,
            type: TEMPLATE_TYPE_NORMAL,
            installCommand: 'npm install --registry=http://registry.npm.taobao.org/',
            serveCommand: 'npm run dev'
        },
        {
            name: '大也-大屏模板',
            projectId: 292,
            resType: TEMPLATE_TYPE_RES_GITLAB,
            type: TEMPLATE_TYPE_NORMAL,
            version: 'latest',
            installCommand: 'npm install --registry=http://registry.npm.taobao.org/',
            serveCommand: 'npm run serve'
        },
        {
            name: '大也-后台模板',
            projectId: 293,
            resType: TEMPLATE_TYPE_RES_GITLAB,
            type: TEMPLATE_TYPE_NORMAL,
            version: 'latest',
            installCommand: 'npm install --registry=http://registry.npm.taobao.org/',
            serveCommand: 'npm run serve'
        },
        {
            name: '大也-uniapp小程序模板',
            projectId: 301,
            resType: TEMPLATE_TYPE_RES_GITLAB,
            type: TEMPLATE_TYPE_NORMAL,
            version: 'latest',
            installCommand: 'npm install --registry=http://registry.npm.taobao.org/',
            serveCommand: 'npm run dev:h5'
        }
    ],
    types: {
        TEMPLATE_TYPE_RES_NPM,
        TEMPLATE_TYPE_RES_GITLAB,
        TEMPLATE_TYPE_RES_GITHUB,

        TEMPLATE_TYPE_NORMAL,
        TEMPLATE_TYPE_COSTUM
    }
}
