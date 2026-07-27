---
name: pixel-art-gen
description: >-
  PetPet 像素风图标/贴图生成技能。生成与项目画风一致的像素风 PNG 图标（透明背景），
  适用于物品图标、道具图标、UI 图标等。
  触发词："生成图标"、"生图"、"像素图"、"画图标"、"制作图标"、"pixel art"、"生成贴图"。
---

# Pixel Art Gen Skill — PetPet 像素风图标生成

为 PetPet 项目生成风格统一的像素风 PNG 图标（透明背景，常用 128x128 内容尺寸）。

## 依赖

- `scripts/chroma_key.py` — 抠图工具（Python + Pillow），见下方 Step 2 完整文档
- Python 3 + Pillow（已全局可用，PIL 12.0.0）
- 调用 `imagegen` 子智能体（Task tool 的 subagent_type）

## 核心流程

### 两步法（解决 AI 生图不支持透明背景的问题）

```
Step 1: 生成 → 带纯色背景的图片（前景尽量占满画面）
Step 2: 抠图 → chroma_key.py 自动抠除纯色背景 → 透明 PNG
```

---

## Step 1: 生成图片

### 提示词模板

使用 `imagegen` 子智能体（Task tool + subagent_type="imagegen"），提示词必须包含以下要素：

**必需指令：**
- `bright magenta background (#FF00FF)` — 纯品红背景，用于后续抠图
- `fill MOST of the frame` — 前景尽量占满画面（减少空白）
- `pixel art style` — 像素风
- `no text` — 无文字
- 使用尺寸 `2048x2048`（模型支持的最小方形尺寸）

**当前项目画风参考（必须遵循）：**
- 风格：soft pixel art（柔和像素风），带抗锯齿和渐变过渡
- 色彩：32-bit RGBA 全彩，无调色板限制
- 描边：干净圆润的轮廓线
- 着色：每个颜色区域 2-4 层明暗过渡
- 氛围：可爱、简洁、易识别

### 示例提示词

```
A pixel art icon of a [描述对象], game item icon style,
bright magenta background (#FF00FF),
fill MOST of the frame, centered composition,
cute pixel art style with soft shading, clean edges,
[color palette description], no text
```

---

## Step 2: 抠图处理

### 工具

`scripts/chroma_key.py` — Python Pillow 脚本，自动完成：

| 功能 | 说明 |
|------|------|
| 自动检测背景色 | 采样图片，取最频繁颜色作为抠图基准色 |
| 色度抠图 | 基于颜色距离（欧几里得距离），可配置 tolerance |
| 抗锯齿边缘处理 | 过渡区按距离比例混合 alpha |
| 自动裁剪+留白 | 裁剪空白后添加 padding 像素的透明边距 | 0（不留白） |
| 缩放到目标尺寸 | 默认 128x128（物品图标标准尺寸） |

### 调用方式

```powershell
python scripts/chroma_key.py <input.png> <output.png> auto <tolerance> <WxH> <padding>
```

| 参数 | 说明 | 默认值 |
|------|------|--------|
| input | 输入图片（带纯色背景） | 必填 |
| output | 输出 PNG（透明背景） | 必填 |
| key_color | 抠图基准色，`auto` = 自动检测 | auto |
| tolerance | 颜色距离容差（越大越激进） | 60 |
| output_size | 目标内容尺寸，如 `128x128` | 不缩放 |
| padding | 内容四周留白像素数（画布会扩大） | 0 |

### 针对项目场景的建议 tolerance

| 场景 | tolerance | 原因 |
|------|-----------|------|
| 品红背景 (#FF00FF) | 60-80 | 背景是渐变，距离前景 200+，安全 |
| 亮绿背景 | 50-60 | 绿色通道差异大 |
| 纯色背景（非渐变） | 30-40 | 背景单一，可以更精准 |

---

## 完整工作流示例

```
用户: 生成一个"苹果"图标

1. 构造提示词（含品红背景 + 占满画面指令）
2. 调用 imagegen 子智能体生成图片
3. 下载图片到临时目录
4. 运行 chroma_key.py 抠图 → 缩放 + 留白
   python scripts/chroma_key.py raw.png icon.png auto 60 128x128 16
   # 输出 160x160（128x128 内容 + 四周 16px 透明边距）
5. 保存到 src/assets/icon/
6. 告知用户结果
```

---

## 注意事项

1. **品红背景 (#FF00FF) 是首选** — 自然界极少出现品红色，不易误伤前景
2. **AI 可能不严格按照"fill the frame"** — 可在提示词中强调 `fill MOST of the frame, zoom in, take up at least 80% of the canvas`
3. **output_size 控制内容大小，padding 控制留白** — 如 `128x128` 内容 + `16` padding = 160x160 画布。画布不强制 128x128，大画布也 OK
4. **生成后检查** — 确保抠图干净、内容居中、尺寸正确
5. **不要直接使用 imagegen 的输出** — 必须经过 chroma_key.py 处理

---

## 实战经验（2026-07-26 验证）

### 测试对象：枯树枝（枯树树枝）

| 版本 | 提示词策略 | 结果 |
|------|-----------|------|
| v1 | 英文详细描述像素风（soft pixel, anti-aliasing, 2-4 tone shading） | 带渐变背景，前景未占满 |
| v2 | 英文（dry withered tree branch, cute pixel style, brown/gray） | 同上，背景非纯色 |
| v3 | 全中文（枯树枝 像素风图标 透明背景 卡通可爱风格） | 同上 |
| 品红版 | 英文 + `bright magenta background (#FF00FF)` | 品红渐变背景，抠图距离 200+，可干净分离 |

**结论：**
- 不带背景色指令 → AI 自己生成随机渐变背景，无法自动抠图
- 带 `bright magenta background (#FF00FF)` → 背景色仍会渐变，但整体色相一致，距离前景 >200，auto tolerance 60 即可干净抠除
- `fill MOST of the frame` 要加粗强调（`ZOOMED IN, at least 80% of canvas`），否则 AI 习惯画小物体居中

### 测试对象：红苹果

使用改进后的提示词（加 `ZOOMED IN` + 占满画面强调），效果显著提升：

| 指标 | 值 |
|------|-----|
| 画面占比 | 73.9%（之前枯树枝仅 ~3%） |
| 品红残留 | 0 px |
| 输出尺寸 | 128x128 内容 + 16px padding = 160x160 |
| 抠图质量 | 边缘干净，无锯齿残留 |

**画风对比（生成 vs 现有项目图标）：**

| 维度 | 生成苹果 | 现有图标 `item_apple.png` |
|------|---------|--------------------------|
| 主色 | (241,1,35) 鲜艳红 | (221,49,49) 柔和红 |
| 色彩层次 | 较单一 | 更多渐变层次 |
| 画面占比 | 73.9% | 51.9% |

**经验：** 如果希望贴近现有风格，提示词中应追加 `muted colors, pastel palette, soft shading, 3-4 tone shading`