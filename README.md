# 脚手架工具

提供一些工作中方便使用的命令

## 安装

-   安装最新代码

```bash
npm i @blinkjun/cli -g
```

## 目录结构

```
├─ packages                            // 存放所有模块
│  ├─ commands                         // 所有的命令
│  │  └─ init                          // 初始化命令
│  │     ├─ index.js                   //
│  │     └─ templates.js               //
│  ├─ config.js                        // 配置文件
│  ├─ core                             // 脚手架核心
│  │  ├─ bin.js                        //
│  │  ├─ cli.js                        //
│  │  ├─ command.js                    //
│  │  ├─ env.js                        //
│  │  ├─ exec.js                       //
│  │  └─ prepare.js                    //
│  └─ utils                            // 工具类
│     ├─ gitlab.js                     //
│     ├─ log.js                        //
│     └─ utils.js                      //
```

## 使用

通过`blink <command> [params]`的方式使用命令

使用`blink -h`,查看可用的参数.

## 命令：`command`

1. `blink init <projectName>`：初始化项目，选择项目模板，携带`projectName`时创建子目录，详情请看：[`init command`](./packages/commands/init/readme.md)

2. `blink version `：更新项目版本，**请注意**，该操作请在项目的所有更改都提交完毕时使用！详情请看：[`version command`](./packages/commands/version/readme.md)

3. `blink tinyimg`：压缩图片，详情请看：[`tinyimg command`](./packages/commands/tinyimg/readme.md)
