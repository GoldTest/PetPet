# PocPet

PocPet 是一个桌面与移动端虚拟宠物应用，围绕陪伴、番茄钟、道具、宠物状态和可替换宠物 Mod 展开。项目基于 Tauri、React、TypeScript 与 Rust 构建，目标是提供轻量、可定制、可跨平台分发的个人桌宠体验。

当前项目仍处在早期阶段，接口、存档格式和 Mod 规范会继续演进。欢迎提交问题、建议和改造。

## 开源与 AI 参与说明

PocPet 是一个个人实验性质项目。项目中的大部分代码由 AI 编程助手生成或在 AI 辅助下完成，再由维护者人工筛选、整合、调试和发布。代码结构、玩法数值和界面细节仍会随着个人需求持续变化，不承诺稳定路线图或长期兼容全部二次开发方向。

如果你想做自己的桌宠、玩法分支、商业包装或更长期维护的版本，推荐直接 fork 本仓库，在自己的分支中替换素材、调整规则和整理发布流程。欢迎提交 issue 或 PR，但和 PocPet 当前设计方向差异较大的改造，更适合在 fork 中独立推进。

## 素材声明

仓库内随项目发布的图片素材，包括宠物图片、道具图标、树木图片、CG、应用图标和内置 Mod 图片，均由 AI 生成或 AI 辅助生成，并由 FrostForge Studio 筛选、整理和接入项目。除非单个文件或后续说明另有标注，这些图片素材随本项目按 GPL-3.0-or-later 一并发布。

贡献新素材或 Mod 示例时，请只提交你拥有充分授权、可按 GPL-3.0-or-later 公开分发的内容。不要提交未经授权的第三方角色、商标、游戏截图、音乐、字体、音效或其他受限素材。

## 功能概览

- 虚拟宠物状态：饥饿、清洁、心情、精力、健康等基础状态。
- 道具与商店：固定核心道具 ID，支持食物、礼物、护理和功能道具。
- 番茄钟：工作与休息流程会影响宠物活动反馈。
- Mod：通过 zip 导入替换宠物图片、道具图片、默认名称、默认生日、展示文本和喜欢食物。
- 存档导入导出：以带版本号的文本格式备份和恢复当前数据。
- 多语言基础：当前包含中文与英文文案。

## 技术栈

- Tauri 2
- React 18
- TypeScript
- Vite
- Rust
- Android Gradle 项目由 Tauri 生成并纳入仓库

## 本地开发

环境要求：

- Node.js 18 或更新版本
- npm
- Rust stable
- Tauri 2 所需系统依赖
- Android 构建需要 Android SDK、NDK 与 Java/Gradle 环境

安装依赖：

```bash
npm install
```

启动前端开发服务器：

```bash
npm run dev
```

启动 Tauri 开发模式：

```bash
npm run tauri:dev
```

前端构建检查：

```bash
npm run build
```

## 打包

Windows 便携 exe：

```powershell
npm.cmd run package:win:portable
```

网页版部署包：

```powershell
npm.cmd run package:web
```

Android arm64 APK：

```powershell
npm.cmd run package:android:arm64
```

说明：默认 Android 打包脚本会重建 Tauri Android arm64 原生库和内嵌前端资源，再生成、对齐、debug 签名并校验 APK。网页版部署包会把当前 `dist/` 压缩为 `release/pocket<version>-web.zip`。

macOS 与 Linux 需要在对应系统上构建：

```bash
npm run package:desktop
```

macOS 目标产物以 `.dmg` / `.app` 为主。Linux 目标产物以 `.AppImage` / `.deb` 为主，优先面向 Ubuntu 兼容环境；国产 Linux 发行版通常可优先测试 AppImage，Debian/Ubuntu 系发行版可测试 deb 包。

## Gitee 自动构建与发行版

仓库包含 `.gitee/workflows/release.yml` 作为自动构建模板。设计目标是每次推送或打 tag 时构建：

- Windows：`PocPet-<version>.exe`
- Android：`PocPet-<version>.apk`
- macOS：dmg/app
- Linux：AppImage/deb，优先 Ubuntu 兼容，也便于国产 Linux 发行版测试

要启用自动发布到 Gitee Release，需要在 Gitee 仓库的流水线/Actions 密钥中配置：

- `GITEE_TOKEN`：拥有创建 Release 和上传附件权限的私人令牌
- `GITEE_OWNER`：仓库所属用户名或组织名，例如 `ferrisM`
- `GITEE_REPO`：仓库名，例如 `poc-pet`

macOS 构建需要 macOS runner。Gitee 如果没有提供对应托管 runner，需要使用自托管 runner。Linux 构建建议使用 Ubuntu 22.04 或更新版本。Android 构建需要 runner 预装 Android SDK/NDK，或在流水线中补齐安装步骤。

Gitee 的流水线能力、runner 标签和 Release API 可能因账号/企业版配置不同而不同；如果平台语法或 runner 标签与当前模板不一致，请按 Gitee 当前流水线界面生成的 YAML 调整 `.gitee/workflows/release.yml`。


## Mod 制作

制作指南：

- `docs/mod制作指南.md`
- `docs/mod-guide.md`

推荐新 Mod 使用 `schemaVersion: 2`，可以替换宠物图片、道具图片、默认姓名、默认生日、展示文本、喜欢食物、好结局 CG，并可添加带命名空间的安全自定义道具。Mod 不开放节日奖励池、核心玩法数值、存档规则或番茄钟规则。

## 存档兼容

项目保留内部旧存档 `pocpet.pet.v1` 兼容。外部导入导出使用带版本号的文本格式，并在导入时重置时间基线，避免旧备份恢复后立即触发离线衰减或番茄钟自动结算。

## 许可

本项目采用 GNU General Public License v3.0 or later（GPL-3.0-or-later）授权，详见 `LICENSE.md`。

你可以按照 GPLv3 的条款使用、复制、修改和分发本项目。分发修改版或衍生作品时，需要同样以 GPLv3 兼容方式开放相应源代码，并保留版权与许可证声明。

## 贡献

提交贡献前请确认：

- 你的贡献可在 GPLv3 许可下发布。
- 不提交未授权素材、字体、音频或第三方资源。
- 不破坏旧存档兼容和当前 Mod v1 格式。
- 涉及用户数据、存档和 Mod 解析的改动需要考虑向后兼容。


