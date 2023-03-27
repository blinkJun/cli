# `init`

根据模板初始化项目

## 使用说明

`init <projectName> [-f]`：初始化项目，选择项目模板

-   `projectName`：不携带时当前文件夹作为根目录，携带时创建一个子目录。
-   `-f`选项：无此选项时检查当前文件夹是否需要清空，携带时强制清空文件夹内所有内容，**请谨慎使用**。

## 如何创建一个项目模板：

1.  创建项目模板：在`http://git.gxucreate.com:8091/gxdaye/web/infrastructure/templates`此分组下创建项目模板
2.  填充变量：为模板填充初始化变量，当前提供以下几个变量

    -   `appName`：项目名称
    -   `version`：版本号
    -   `description`：描述

    在模板中填充：

    ```json
    // package.json
    {
        "name": "<%= appName %>",
        "version": "<%= version %>",
        "description": "<%= description %>"
    }
    ```

3.  打版本标签：推送到远程仓库后为模板的当前提交创建一个标签，如：`v1.0.0`
4.  配置初始化选项：进入到此脚手架的`packages/commands/init/templates.js`文件，增加对应模板信息：

    ```json
    {
        "name": "大也-uniapp小程序模板",
        "projectId": 301, // 对应模板的git项目id，在项目-设置-常规-常规项目设置中查看
        "version": "latest", // 使用项目版本（标签）,如：v1.0.0
        "installCommand": "npm install --registry=http://registry.npm.taobao.org/", // 安装依赖命令
        "serveCommand": "npm run dev:h5" // 启动本地服务命令
    }
    ```

5.  推送并且更新脚手架版本（标签）。安装最新脚手架即可使用。
