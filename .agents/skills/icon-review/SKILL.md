# Skill: icon-review — 图片/图标评估流程

> 触发词：图片评估、图标评估、icon评估、review icons、verify icons

## 概述

管理项目图标的「生成 → 审核 → 采纳」三阶段流程，确保所有像素风图标质量合格。

## 目录结构

图标目录按业务划分，每个业务一套三阶段目录 `<业务>-icons-{raw,review,done}`，如蔬菜业务 `veg-icons-*`、果树业务 `tree-icons-*` 等：

```
src/assets/
├── veg-icons-raw/         ← 生图原稿，尚未图片处理（未抠图，含背景色）
├── veg-icons-review/      ← 待人工评审
├── veg-icons-done/        ← 人工评审通过，可直接加载使用
├── tree-icons-raw/        ← （示例）果树业务，以此类推
├── tree-icons-review/
├── tree-icons-done/
```

## 流程

### 1. 确认问题

用像素分析脚本扫描图标，自动检测三类问题：

```powershell
# 检测图标质量
$reviewDir = "D:\Develop\Projects\petpet\src\assets\veg-icons-review"
$dir = "D:\Develop\Projects\petpet\src\assets"

foreach ($f in (Get-ChildItem -LiteralPath $dir -Filter "*.png")) {
    $name = $f.Name
    # 跳过已知目录
    if ($name -match "veg-icons-") { continue }
    $img = [System.Drawing.Bitmap]::FromFile($f.FullName)
    $w=$img.Width; $h=$img.Height
    $c=$img.GetPixel([int]($w/2), [int]($h/2))
    $brightness=($c.R+$c.G+$c.B)/3
    $opaque=0; $total=0
    for ($y=0; $y -lt $h; $y+=2) {
        for ($x=0; $x -lt $w; $x+=2) {
            $total++
            $p=$img.GetPixel($x,$y)
            if ($p.A -gt 10) { $opaque++ }
        }
    }
    $pct=[math]::Round($opaque/$total*100, 1)
    $img.Dispose()

    $issues = @()
    if ($brightness -lt 10) { $issues += "颜色反转(中心黑)" }
    if ($pct -lt 15) { $issues += "内容过小(${pct}%)" }
    $flag = $issues -join ","
    if ($flag) { Write-Output "ISSUE: $name $flag RGB($($c.R),$($c.G),$($c.B))" }
}
```

### 2. 分类

目录按业务划分：每个业务（如 `veg` 蔬菜、`tree` 果树等）有独立的 `<业务>-icons-{raw,review,done}` 三阶段目录。

| 目录 | 状态 |
|------|------|
| `<业务>-icons-raw/` | 生图原稿，尚未图片处理（未抠图，含背景色） |
| `<业务>-icons-review/` | 待人工评审 |
| `<业务>-icons-done/` | 人工评审通过，可直接加载使用 |
| `src/assets/` 根目录 | 当前实际使用的图片（含问题图片） |

**人工评审流程**：AI 只做自动检测并汇报（无需 AI 目视判定）；最终审核由用户目视确认。用户给出评审结果后，AI 将通过的图片手动移动到对应业务的 `done` 目录（如 `veg-icons-done/`），该移动动作即视为人工评审通过。

### 3. 生成新图标

使用 `pixel-art-gen` skill 的两步法：

1. 调用 `imagegen` 子智能体生成（品红背景 `#FF00FF`，2048×2048）
2. 用 `scripts/chroma_key.py` 抠图：
   ```powershell
   python scripts/chroma_key.py <raw.png> <output.png> auto 60 128x128 16
   ```

**提示词模板**（必须包含）：
- `bright magenta background (#FF00FF)` — 品红背景用于抠图
- `fill MOST of the frame` / `at least 80% of canvas` — 占满画面
- `pixel art style, soft pixel art` — 柔和像素风
- `muted pastel palette` — 粉彩调色板
- `no text` — 无文字
- 尺寸 `2048x2048`

**颜色反转问题**：如果生成的图标球茎/果实呈品红色（被抠图吃掉），改用 `bright lime green background (#00FF00)` + 指定前景色为白色/紫色等非品红颜色。

### 4. 质量验证

每个图标必须满足：
- 尺寸：160×160（128×128 内容 + 16px 透明边距）
- 中心像素亮度 > 10（非黑）
- 不透明像素占比 > 15%（内容不过小）
- 透明背景（alpha 正确）

### 5. 部署

用户评审确认 OK 后（由 AI 手动执行移动，见第 2 节）：
1. 从 `<业务>-icons-review/` 移到 `<业务>-icons-done/`
2. 从 `<业务>-icons-done/` 复制到 `src/assets/`（覆盖原文件）
3. 清理 `src/assets/` 下的临时目录

### 6. 报告格式

给用户汇报时，按以下格式：

```
=== DONE (N icons) ===
  icon_xxx.png
  ...

=== REVIEW (N icons) — 待审核 ===
  icon_xxx.png [OK]
  icon_xxx.png [SMALL] ← 需要重新生成
```

## 已知问题处理

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| 中心黑色（亮度0） | 抠图后中心为空或颜色反转 | 检查是否球茎被品红吃掉 → 换绿色背景重生 |
| 内容过小（<15%） | AI 画得太小或抠图切掉太多 | 提示词加强 `ZOOMED IN 85-90%`；降低 chroma_key tolerance |
| 中心品红色 | 球茎被画成与背景同色 | 明确指定球茎颜色，换背景色 |
