# PocPet 项目 CodeWiki

本文记录 PocPet 当前开发事实，作为开发、构建、维护和后续功能规划的入口。玩法路线图见 `docs/dev/开发路线图.md`，Mod 制作方法见 `docs/mod制作指南.md` 和 `docs/mod-guide.md`。

## 项目定位

PocPet 是 FrostForge Studio 制作的轻量桌宠 / 挂机休闲应用，核心体验围绕陪伴、照顾、轻量成长、番茄钟和可替换宠物 Mod 展开。

当前目标不是高压签到或重度刷数值，而是让玩家通过喂食、清洁、玩耍、睡眠、工作、购物、每日小愿望和回归欢迎等短操作获得稳定反馈。

## 技术栈

- Tauri 2：桌面与移动端壳层。
- React 18 + TypeScript：前端 UI 和交互。
- Vite：前端构建。
- Rust：Tauri 后端入口。
- Android Gradle 工程：由 Tauri 生成并纳入仓库。

## 常用命令

```powershell
npm install
npm run dev
npm run tauri:dev
npm run build
```

Windows 测试包：

```powershell
npm.cmd run package:win:portable
```

Web 部署包：

```powershell
npm.cmd run package:web
```

Android arm64 测试包：

```powershell
npm.cmd run package:android:arm64
```

需要复用已确认最新的 Android `.so` 时才使用：

```powershell
npm.cmd run package:android:arm64:reuse
```

前端 UI、CSS、资源或 Tauri 配置有改动时，应使用默认 rebuild 脚本，不要复用旧 Android 资源。

## 打包发布约定

- 当前版本来源以 `package.json` 为准，Tauri 和 Cargo 配置需要同步。
- 版本号使用标准 semver，例如 `1.0.10`，不要使用 `1.09` 或 `1.0`。
- Windows 当前测试产物为 `release/pocket<version>.exe`。
- Web 当前部署产物为 `release/pocket<version>-web.zip`。
- Android 当前测试产物为 `release/pocket<version>.apk`。
- Android 测试包使用 debug keystore 签名，适合测试分发，不是商店正式签名包。
- `release/` 是交付产物目录，打包产物不应提交到仓库。
- `.gitee/workflows/release.yml` 是自动构建模板；macOS/Linux 产物需要在对应系统 runner 上构建。

发布前建议顺序：

1. 检查工作区和版本号。
2. 更新 `package.json`、Tauri、Cargo 版本字段。
3. 打包 exe、APK 和 Web 部署包。
4. 确认产物可启动或安装。
5. 再提交版本号和源码改动。

## 目录结构

- `src/core`：核心状态、数值、道具、存档、Mod、番茄钟、日期奖励、每日愿望、回归欢迎。
- `src/ui`：React 组件、主界面、弹窗、状态栏、操作栏、番茄钟浮层。
- `src/i18n`：中文和英文文案。
- `src/assets`：前端资源映射。
- `src/assets/pet`：宠物状态和活动图片。
- `src/assets/icon`：商品、道具和货币图标。
- `src/assets/audio`：`bgm`、`ui`、`action`、`pet` 音频资源。
- `src-tauri`：Tauri 配置、Rust 入口、图标和生成的 Android 工程。
- `docs`：公开文档和开发文档。
- `docs/dev`：开发用 CodeWiki 与路线图。
- `examples/mods`：示例 Mod。
- `release`：本地测试交付文件。

## 核心模块

- `petTypes.ts` 定义 `PetState`、`ItemId`、番茄钟、每日愿望、回归欢迎、年度统计等核心类型。
- `petState.ts` 创建默认宠物、规范化旧存档、补齐新增字段。
- `petActions.ts` 处理喂食、清洁、玩耍、工作、触摸、升级等操作。
- `items.ts` 定义商店道具、价格、效果、每日饼干和小心心换金币限制。
- `dailyWishes.ts` 定义每日小愿望和回归欢迎的生成、进度、奖励。
- `pomodoro.ts` 定义番茄钟状态、流程和奖励结算。
- `dateRewards.ts` 定义生日、周年、节日奖励和 6 点刷新规则。
- `yearlyStats.ts` 记录年度活跃、照顾、道具和番茄钟统计。
- `saveCodec.ts` 负责外部存档导入导出、校验和时间基线重置。
- `storage.ts` 负责本地宠物存档读写。
- `mod.ts` 和 `modStorage.ts` 负责 Mod manifest、zip 校验、资源替换和激活 Mod 存储。

UI 入口集中在 `src/ui/App.tsx`。主界面通过 `StatusBar`、`PetDisplay`、`ActionDock`、`FeatureRow`、`InventoryPanel`、`ShopModal`、`SettingsModal`、`PomodoroOverlay`、`YearReviewModal` 组合当前体验。

## 当前玩法系统

- 基础状态：饥饿、清洁、心情、精力、健康、等级、年龄、睡眠。
- 经济：金币、小心心、背包、商店、每日折扣、每日饼干、小心心换金币。
- 照顾操作：喂食、清洁、玩耍、工作、触摸、睡眠、使用道具。
- 番茄钟：专注 / 休息流程，影响宠物活动反馈并累计专注统计。
- 日期奖励：生日、周年、节日、月度礼物、年度总结。
- 每日小愿望：每天 6 点刷新，当前目标池包含喂食、清洁、玩耍、摸摸、打工一次。
- 回归欢迎：离开 36 小时以上时生成恢复任务和轻量补给，不做强惩罚。
- 天气和季节：影响反馈文本、状态变化或活动氛围。
- Mod v1：替换宠物图、道具图、默认名字、默认生日、展示文本和喜欢食物。

## 存档兼容

- 本地基础宠物存档键为 `pocpet.pet.v1`。
- 外部导出格式为 `PocPetSaveFileV1`，包含 `schemaVersion: 1`、`app: "PocPet"`、`exportedAt`、`pet` 和可选 `activeMod`。
- 导入支持带包装的 PocPet 存档，也支持裸 `PetState` JSON。
- 导入时会规范化字段并重置时间基线，避免旧备份恢复后立即触发不合理的离线结算或番茄钟自动结算。
- 新增长期状态时必须在 `normalizePet` 中补齐旧存档默认值。
- 涉及跨年度累计的未来系统不应只依赖 `yearlyStats`，需要独立 lifetime stats。

## Mod 边界

v1 Mod 只开放：

- 宠物图片。
- 道具图片。
- 默认宠物名字。
- 默认生日。
- 展示文本。
- 喜欢食物。

v1 Mod 不开放：

- 新增道具 ID。
- 修改商店价格、效果或行为。
- 修改节日奖励池。
- 修改核心数值公式。
- 注入运行时代码。

未知文件会被拒绝，缺失图片回退到内置资源。Mod 能力扩展必须优先保证存档兼容和失败回退。

## 资源约定

- 宠物状态图保持单形态视觉基础，活动图按 `RecentActivity` 映射。
- 商品图标与固定 `ItemId` 对应。
- 内置特殊道具 `birthday_cake` 只通过生日获得，v1 暂不支持 Mod 自定义。
- 音频按用途分组，部分音频仍是合并素材，后续替换时要同步更新映射和引用。
- Android 图标与 Windows app 同源，来源为 `src-tauri/icons/icon.png`。

## 开发注意

- 文档版本路线不等于正式发版号，正式版本以 `package.json`、Tauri、Cargo 配置为准。
- 低压力陪伴是核心方向，避免新增强签到、失败惩罚或重度刷数值系统。
- 冒险、种植、成就、房间装扮等未来功能需要先考虑存档字段、旧档补齐和导入失败处理。
- 基础养成存档不要直接塞入大型冒险系统数据，冒险应作为 2.0 独立扩展存储。


