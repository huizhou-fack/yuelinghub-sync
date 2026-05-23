# 阅灵同步（YuelingHub Sync）

将专属信息茧房（阅灵）订阅文章同步到 Obsidian vault。

## 功能

- 从阅灵 API 拉取文章并保存为 Markdown
- 支持多种同步范围：全部已关注、仅收藏、按分组
- 增量同步（基于 `post_time`）
- 完整正文（HTML 转 Markdown）+ frontmatter 摘要
- 手动同步、定时同步、冲突策略（跳过/覆盖）

## 隐私与网络

本插件需要访问你配置的阅灵 API 地址（默认 `https://yuelinghub.com`），以拉取你的订阅文章数据。

- 用户 token 仅保存在本地 vault 的插件数据中
- 不会收集或上传 vault 内其他内容
- 正文中的图片保留远程 URL，不会自动下载

## 安装

1. 将 `main.js`、`manifest.json` 放入 vault 的 `.obsidian/plugins/yuelinghub-sync/` 目录
2. 在 Obsidian 中启用 **Settings → Community plugins → 阅灵同步**

开发构建：

```bash
npm install
npm run dev   # 监听编译
npm run build # 生产构建
```

## 配置

1. 在小程序或 web 管理端获取用户 token（`POST /api/wx/get_token`）
2. 打开 **Settings → Community plugins → 阅灵同步**
3. 填写 API 地址和用户令牌
4. 点击 **验证并刷新** 加载分组
5. 选择同步模式与目标文件夹
6. 执行 **立即同步文章** 命令，或点击左侧 ribbon 下载图标

## 同步文件格式

```
阅灵/{公众号名称}/{YYYY-MM-DD} {标题}.md
```

Frontmatter 包含 `yueling_id`、`title`、`source`、`url`、`published`、`summary`、`groups`、`tags` 等字段。

## 命令

| 命令 | 说明 |
|------|------|
| 立即同步文章 | 手动触发同步 |
| 重置同步状态 | 清空增量记录，下次重新拉取 |
| 打开同步目录 | 打开最近同步的文章 |
| 打开同步设置 | 进入阅灵同步设置页 |

底部状态栏显示同步状态，点击 **设置** 可快速进入插件设置。

## 后端 API

插件依赖 wx-pusher-admin 提供的专用接口：

- `POST /api/plugin/obsidian/authorize`
- `POST /api/plugin/obsidian/meta`
- `POST /api/plugin/obsidian/articles`

## 开发

参考 [Obsidian 插件开发工作流](https://docs.obsidian.md/Plugins/Getting+started/Development+workflow)。

修改源码后运行 `npm run dev`，在 Obsidian 中禁用/启用插件或使用 [Hot-Reload](https://github.com/pjeby/hot-reload) 热重载。
