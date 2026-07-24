---
name: fork-check
description: >-
  分叉检查技能。从分叉点对比上游（PocPet）持有而下游（PetPet）没有的修改，生成特性分叉列表用于评估哪些上游特性
  值得在下游自行实现。注意：是评估特性价值后自行实现，不是 cherry-pick 上游代码。
  每次评估后必须强制生成一个分叉检查点提交，记录已评估的上游 commit 点，下次评估从该点继续。
  触发词："分叉检查"、"fork检查"、"上游评估"、"分叉评估"、"upstream check"、"合并上游"、"特性评估"
---

# Fork Check Skill — 分叉检查

## 核心理念

上游（PocPet）和下游（PetPet）已经分叉，两边的代码库独立演进。上游的特性修改**不会直接 cherry-pick** 到下游。

分叉检查的目的是：
1. **发现上游做了什么** — 了解上游新增/修改了哪些功能
2. **评估特性价值** — 判断这些特性对 PetPet 是否有价值
3. **决定实现方式** — 对于有价值的特性，是在 PetPet 中**自行实现**（适配 PetPet 的架构），还是**参考上游实现思路**但重写代码
4. **跟踪进度** — 用检查点记录哪些上游修改已被评估过

## 概念

| 术语 | 说明 |
|------|------|
| 上游 (upstream) | 原仓库 PocPet (`https://github.com/T-meow/PocPet`) |
| 下游 (downstream) | 当前仓库 PetPet (`origin`) |
| 分叉点 (fork point) | `git merge-base upstream/main origin/main` — 两分支分道扬镳的 commit |
| 检查点 (checkpoint) | 记录上次评估截止的上游 commit hash 的文件 `.fork-checkpoint` |
| 评估提交 | 每次评估后强制生成的 `chore(fork-check):` 格式 commit |

## 前置条件

- remote `upstream` 已配置指向 `https://github.com/T-meow/PocPet.git`
- 当前在 `origin/main` 上
- 工作区干净（无未提交修改）

## 工作流程

### Step 1: 获取上游最新代码

```bash
git fetch upstream
```

### Step 2: 确定评估起点

```bash
# 查找上次检查点
$checkpoint = "$(Get-Content .fork-checkpoint -ErrorAction SilentlyContinue)"
if ($checkpoint) {
    Write-Output "从检查点继续: $checkpoint"
} else {
    # 首次运行，使用 fork 点
    $checkpoint = "$(git merge-base upstream/main origin/main)"
    Write-Output "首次评估，从分叉点开始: $checkpoint"
}
```

检查点文件 `.fork-checkpoint` 仅包含一行：上次评估截止的上游 commit 完整 hash。

### Step 3: 列出待评估的上游提交

```bash
git log --oneline "$checkpoint..upstream/main"
```

如果输出为空，说明自上次检查点以来上游没有新提交，无需评估。

### Step 4: 对每个待评估提交做详细分析

对每个 commit 执行以下分析：

```bash
# 获取 commit 详情
git log --format="%H%n%an%n%ai%n%s%n%b" -1 "<commit>"

# 获取涉及文件
git diff --name-only "<commit>^..<commit>"

# 获取 diff 统计
git diff --stat "<commit>^..<commit>"

# 检查下游是否已有类似实现
git log --all --oneline --grep="<关键词>"
```

### Step 5: 生成特性分叉决策列表

按功能特性（而非按 commit）归类，输出决策表格：

| 特性 | 上游实现方式 | 涉及模块 | 价值评估 | 决策 |
|------|------------|---------|---------|------|
| Neighbor 社交系统 | 新增 neighborGifts/neighbors 模块 | src/core/neighbors.ts | 高 - 丰富社交玩法 | 自行实现 |
| 抽卡系统 | 新增 goldenAppleGacha 模块 | src/core/goldenAppleGacha.ts | 中 - 数值系统 | 暂不处理 |
| 生命周期加固 | 修改 petLifecycle 时序逻辑 | src/core/petLifecycle.ts | 高 - 稳定性提升 | 参考思路重写 |

**价值评估维度：**
- 对 PetPet 用户的价值
- 与 PetPet 现有架构的兼容度
- 实现成本（自行实现 vs 参考上游）

**决策选项：**

| 决策 | 含义 | 后续行动 |
|------|------|---------|
| 自行实现 | 在下游用 PetPet 架构重新实现该特性 | 创建 HarnSpec spec，启动 SDD 流程 |
| 参考思路 | 借鉴上游设计思路但不直接使用代码 | 记入 spec 的 Technical Notes |
| 暂不处理 | 当前不实现，留待以后评估 | 记录到待办列表 |
| 跳过 | 与 PetPet 路线图无关 | 无需后续操作 |

### Step 6: 创建检查点提交

评估完成后，必须创建检查点：

```bash
# 记录本次评估截止的上游 commit
$latest = "$(git rev-parse upstream/main)"
Set-Content -Path ".fork-checkpoint" -Value $latest -NoNewline

git add .fork-checkpoint
git commit -m "chore(fork-check): evaluate upstream commits up to $latest"
```

此 commit 强制创建，不需要用户确认。

### Step 7: 输出分叉评估报告

以 Markdown 格式输出最终的分叉评估报告，包含：

1. **本次评估范围**（从 X 到 Y）
2. **特性分叉决策表** — 按特性归类，标注决策
3. **待实现特性清单** — 决策为"自行实现"或"参考思路"的特性，可直接转化为 HarnSpec SDD 任务

## 检查点文件格式

`.fork-checkpoint` 是一个纯文本文件，仅包含一行：

```
<完整 commit hash>
```

示例：
```
2627318abc123def456...
```

## 分叉评估提交格式

```
chore(fork-check): evaluate upstream commits up to <hash>
```

该 commit 只包含 `.fork-checkpoint` 一个文件的修改。

## 边界情况处理

| 情况 | 处理方式 |
|------|---------|
| 首次运行（无 `.fork-checkpoint`） | 使用 `git merge-base` 作为起点 |
| 上游没有新提交 | 输出"无待评估提交"，不创建检查点 |
| 某特性已被下游自行实现 | 在决策栏标注 ✅ 已实现 |
| 检查点文件有冲突 | 手动解决后继续 |
| 上游分支已 rebase 或 force push | 需要人工介入重新计算检查点 |
| 用户想重新评估已评估过的 commit | 手动删除 `.fork-checkpoint` 后重新运行 |

## 输出示例

```
## 分叉评估报告

**评估范围**: 3d8649c → 2627318 (13 commits)
**评估日期**: 2026-07-24

### 特性分叉决策表

| # | 特性 | 上游提交 | 涉及模块 | 价值 | 决策 |
|---|------|---------|---------|------|------|
| 1 | Neighbor 事件系统 & 每日进度 | 3d8649c, 9905826, 1033be6, 83b0676, 0efbaea | src/core/neighbors.ts, src/core/neighborGifts.ts, src/core/dailyReset.ts | 🔴 高 | 自行实现 |
| 2 | 奖励流程精炼 | 272bfc4 | src/core/dateRewards.ts, src/ui/App.tsx | 🟡 中 | 参考思路 |
| 3 | 抽卡系统 | 0f7e512 | src/core/goldenAppleGacha.ts, src/styles/gacha.css | 🟢 低 | 暂不处理 |
| 4 | Stat scaling & 批量物品操作 | 1d8e3cc | src/core/petStats.ts, src/core/items.ts | 🟡 中 | 自行实现 |
| 5 | 生命周期 & 存档恢复加固 | db50abb, 4df68e3 | src/core/petLifecycle.ts, src/core/saveCodec.ts | 🔴 高 | 参考思路重写 |
| 6 | CI 构建稳定化 | 2dead89, ddec505, 2627318 | .github/workflows/ | 🟢 低 | 跳过（已适配） |

### 待实现特性

以下特性已评估为"自行实现"，建议创建 HarnSpec spec：

1. **Neighbor 社交系统** — 创建 spec `neighbor-system`
2. **Stat scaling & 批量物品操作** — 创建 spec `stat-scaling-batch`
3. **生命周期加固**（参考思路重写）— 创建 spec `lifecycle-hardening`

### 暂不处理

- 抽卡系统 — 待后续版本重新评估
```
