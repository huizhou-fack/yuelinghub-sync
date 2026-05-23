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

## 更新插件

从 [GitHub Releases](https://github.com/huizhou-fack/yuelinghub-sync/releases) 下载最新版本的 `main.js`、`manifest.json`、`styles.css`，覆盖到 vault 目录：

```
<Vault>/.obsidian/plugins/yuelinghub-sync/
```

然后在 Obsidian 中 **Settings → Community plugins** 禁用并重新启用插件，或直接重启 Obsidian。

## 发布新版本（开发者）

本项目使用 [GitHub Actions](https://docs.github.com/en/actions) 自动构建并创建 Release，流程参考 [Obsidian 官方文档](https://docs.obsidian.md/Plugins/Releasing/Release+your+plugin+with+GitHub+Actions)。

### 前置条件

1. 仓库 **Settings → Actions → General → Workflow permissions** 设为 **Read and write permissions**
2. 本地已配置 GitHub 认证（SSH 或 Personal Access Token）

### 发布步骤

```bash
# 1. 更新版本号（自动同步 manifest.json 与 versions.json）
npm version patch   # 1.0.1 → 1.0.2；也可用 minor / major

# 2. 提交并推送代码
git push origin master

# 3. 推送 tag（tag 必须与 manifest.json 中的 version 完全一致，不要加 v 前缀）
git push origin 1.0.2
```

推送 tag 后，GitHub Actions 会自动：

1. 执行 `npm ci && npm run build`
2. 创建 Draft Release
3. 上传 `main.js`、`manifest.json`、`styles.css`

最后在 GitHub **Releases** 页面编辑 Draft Release、填写更新说明，点击 **Publish release** 即可。

### 手动发布（备选）

```bash
npm run build
```

将生成的 `main.js`、`manifest.json`、`styles.css` 手动上传到 GitHub Release。

## 更新日志

### 1.0.2

- 修复按分组同步时仍拉取全部公众号的问题
- 修复 `summary` 字段含换行/特殊字符导致笔记属性无法显示
- 修复删除本地笔记后无法重新同步的问题（自动检测缺失文件并重新拉取）
- 同步文章 frontmatter 增加 `groups` 分组信息
- 移除按标签同步模式
- 状态栏增加 **设置** 快捷入口
- 新增 **打开同步设置** 命令

### 1.0.1

- 初始发布
- 支持全部已关注 / 仅收藏 / 按分组同步
- 完整正文 HTML 转 Markdown + frontmatter 摘要
- 增量同步、定时同步、冲突策略（跳过/覆盖）
- 专用阅灵 Obsidian API 对接
