---
name: mod-maker
description: >-
  PetPet MOD 制作技能。为 PetPet 创建自定义宠物外观包 (mod)。
  触发词："制作MOD"、"mod制作"、"创建mod"、"宠物外观"、"mod包"、"宠物包"、"自定义宠物"、"pet mod"、"mod教程"。
---

# Mod Maker Skill — PetPet MOD 制作指南

为 PetPet 创建自定义宠物 MOD（宠物外观包）。MOD 可以替换宠物精灵图、自定义文本、添加自定义物品等。

---

## 1. 概念

MOD = 宠物外观包。包含一组 PNG 精灵图和 `manifest.json` 清单文件。支持：
- **18 张宠物动作/状态图**（7 状态 + 11 活动）
- **1 张周年结局 CG**
- **自定义物品图标**（覆盖内置 or 新增）
- **文本覆盖**（状态名称、物品名称、描述、欢迎语）
- **自定义物品**（schema v2，完整的新增物品+效果+价格+商店）

---

## 2. 目录结构

```
your-mod/
├── manifest.json           # MOD 清单（必需）
├── pet/                    # 宠物精灵图（推荐全部提供）
│   ├── content.png         # 状态：满足
│   ├── hungry.png          # 状态：饥饿
│   ├── sad.png             # 状态：低落
│   ├── dirty.png           # 状态：肮脏
│   ├── tired.png           # 状态：疲劳
│   ├── sick.png            # 状态：生病
│   ├── sleeping.png        # 状态：睡觉
│   ├── happy.png           # 活动：开心
│   ├── bath.png            # 活动：洗澡
│   ├── eat_cookie.png      # 活动：吃饼干
│   ├── eat_noodles.png     # 活动：吃面条
│   ├── eat_meat.png        # 活动：吃肉
│   ├── give_heart.png      # 活动：送爱心
│   ├── level_up.png        # 活动：升级
│   ├── reading_books.png   # 活动：读书
│   ├── workout.png         # 活动：锻炼
│   ├── work_food.png       # 活动：食物工作
│   └── work_plants.png     # 活动：植物工作
├── cg/                     # CG 图（可选）
│   └── good_ending_year_1.png
└── items/                  # 自定义物品图标（可选，v2）
    └── <item_key>.png      # 参照物品 key 命名
```

---

## 3. manifest.json 完整参考

```json
{
  "schemaVersion": 2,
  "id": "yourname.mypet",
  "name": "MyPet",
  "author": "Your Name",
  "version": "1.0.0",
  "defaultPetName": "mypet",
  "description": "A cute mypet pet pack.",
  "favoriteFoodIds": ["strawberry_cake"],
  "birthday": { "month": 6, "day": 1 },
  "texts": {
    "recentEvent": "mypet 来到你身边了。",
    "favoriteFood": "mypet 喜欢的食物，心情额外 +{amount}。",
    "status": {
      "content": "状态不错",
      "hungry": "饿了",
      "sad": "有点低落",
      "dirty": "需要清洁",
      "tired": "累了",
      "sick": "不舒服",
      "sleeping": "睡觉中"
    },
    "items": {
      "strawberry_cake": { "name": "改名蛋糕", "summary": "新描述" }
    }
  }
}
```

### 字段说明

| 字段 | 类型 | 必需 | 约束 |
|------|------|------|------|
| `schemaVersion` | `1` \| `2` | **是** | 当前为 `2` |
| `id` | string | **是** | 2-64 字符，`/^[a-z0-9][a-z0-9._-]{1,63}$/` |
| `name` | string | **是** | 最多 48 字符 |
| `author` | string | 否 | 最多 48 字符 |
| `version` | string | **是** | 类 semver，最多 32 字符 |
| `defaultPetName` | string | **是** | 最多 16 字符 |
| `description` | string | 否 | 最多 160 字符 |
| `favoriteFoodIds` | string[] | 否 | 必须是已知的内置物品 ID |
| `birthday` | `{month, day}` | 否 | month 1-12, day 1-31 |
| `texts` | object | 否 | 见下方 |
| `items` | object | 否 | 仅 v2 |

### `texts` 子字段

| 字段 | 约束 | 说明 |
|------|------|------|
| `recentEvent` | 最多 240 字符 | 切换 MOD 时的欢迎语 |
| `favoriteFood` | 最多 160 字符 | 可用 `{amount}` 占位符 |
| `status` | 每个值最多 24 字符 | 7 个状态的显示文本 |
| `items` | 每个 name 最多 28，summary 最多 96 | 物品名称/描述覆盖 |

---

## 4. 宠物精灵图完整列表

### 7 个状态图 (`PetStatusImageKey`)

| Key | 含义 | 最低必需 |
|-----|------|---------|
| `content` | 满足 (默认状态) | **是** |
| `hungry` | 饥饿 | **是** |
| `sleeping` | 睡觉 | **是** |
| `sad` | 低落 | 否 |
| `dirty` | 肮脏 | 否 |
| `tired` | 疲劳 | 否 |
| `sick` | 生病 | 否 |

### 11 个活动图 (`PetActivityImageKey`)

| Key | 含义 | 最低必需 |
|-----|------|---------|
| `happy` | 开心 | **是** |
| `bath` | 洗澡 | 否 |
| `eat_cookie` | 吃饼干 | 否 |
| `eat_noodles` | 吃面条 | 否 |
| `eat_meat` | 吃肉 | 否 |
| `give_heart` | 送爱心 | 否 |
| `level_up` | 升级 | 否 |
| `reading_books` | 读书 | 否 |
| `workout` | 锻炼 | 否 |
| `work_food` | 食物工作 | 否 |
| `work_plants` | 植物工作 | 否 |

> 缺失的图片会回退到内置默认图并产生警告。建议提供全部 18 张以获得最佳体验。

---

## 5. 物品系统集成 (v2)

### 5a. 物品图标覆盖

在 `items/` 目录下放置同名的 PNG 即可覆盖内置物品图标，无需在 manifest 额外声明。

如需在 manifest 中声明覆盖（同时修改名称/描述/图标路径），使用 `items.overrides`：

```json
{
  "schemaVersion": 2,
  "items": {
    "overrides": {
      "strawberry_cake": {
        "name": "自定义蛋糕",
        "summary": "自定义描述",
        "image": "items/strawberry_cake_custom.png"
      }
    }
  }
}
```

### 5b. 自定义物品

在 `items.custom` 数组中定义全新物品（v2 独占）：

```json
{
  "schemaVersion": 2,
  "items": {
    "custom": [
      {
        "id": "yourname.mypet:magic_gem",
        "name": "魔法宝石",
        "summary": "闪闪发光的宝石，让宠物心情大好。",
        "kind": "item",
        "price": 500,
        "effect": { "mood": 30 },
        "image": "items/magic_gem.png",
        "shop": true,
        "tags": ["rare", "shiny"]
      }
    ]
  }
}
```

**自定义物品约束：**
- `id` 必须以 `modId:` 开头（如 `yourname.mypet:item_name`）
- `kind` 可选值：`food` | `item` | `care` | `garden`
- `price` 范围 0–99999
- `effect` 可选属性：`hunger` | `mood` | `cleanliness` | `energy` | `health`（各 -100–100）
- `shop` 是否在商店上架
- `tags` 最多 16 个，每个最多 32 字符，小写字母数字+短横下划线
- `image` 可选，指向 `items/<name>.png`

---

## 6. 内置物品 ID 完整列表 (供 `favoriteFoodIds` / `items.overrides` 使用)

```
emergency_biscuit, bento, orange, apple, banana, watermelon,
nutri_meal, pig_trotter, strawberry_cake, birthday_cake,
ad_milk, strawberry_milk, small_bouquet, shiny_sticker,
soft_cloud_doll, ribbon_bell, toy_ball, picture_book,
shampoo, wet_wipes, medicine, vitamin_tablet, blanket,
energy_drink, golden_apple, fruit_tree_sapling, care_tree_sapling,
gift_tree_sapling, money_tree_sapling, golden_apple_tree_sapling,
normal_fertilizer, heart_fertilizer, harvest_nutrient
```

---

## 7. 制作流程

### 步骤 1：创建目录结构

```
mkdir my-mod && cd my-mod
mkdir pet cg items
```

### 步骤 2：准备宠物精灵图

- 所有图片必须为 **PNG** 格式（合法 PNG 头：`89 50 4E 47 0D 0A 1A 0A`）
- 建议尺寸参考内置 MOD：`src/mods/mod-mint/pet/`
- 单图大小 ≤ **3MB**

### 步骤 3：编写 manifest.json

参考上方模板，确保：
- `id` 使用你的命名空间（如 `yourname.mypet`）
- `schemaVersion` 为 `2`
- 所有必需字段已填写

### 步骤 4：在本地测试

设置成内置 MOD 方便开发时调试：

1. 将 MOD 目录放在 `src/mods/` 下（如 `src/mods/my-mod/`）
2. `src/core/builtinMods.ts` 使用 `import.meta.glob` 自动发现 `../mods/*/manifest.json`
3. 重新运行 dev server：`npm run dev`
4. 在游戏设置中选择 MOD 即可看到效果

### 步骤 5：打包发布

```bash
# 压缩整个目录为 ZIP
Compress-Archive -Path my-mod/* -DestinationPath my-mod.zip
```

约束：
- ZIP 总大小 ≤ **25MB**
- 仅允许 `manifest.json` + `pet/*.png` + `cg/*.png` + `items/*.png`
- 不支持子目录嵌套

---

## 8. 常见问题

| 问题 | 原因/解决 |
|------|-----------|
| 导入 MOD 后宠物显示为空白 | PNG 格式不合法，检查文件头 |
| 自定义物品 ID 报错 | 必须以 `modId:` 开头 |
| 游戏提示 schema 版本过高 | `schemaVersion` 错误，当前为 `2` |
| 某些动作没有自定义图片 | 缺失的图会回退到内置。要完全自定义需提供全部 18 张 |
| 打包后 ZIP 导入失败 | ZIP 内路径必须以 `manifest.json` 为根，不能有外层目录 |

---

## 9. Golden Samples

| 参考 | 路径 | 说明 |
|------|------|------|
| MOD 示例 - mint | `src/mods/mod-mint/` | 完整的内置 MOD 示例 |
| MOD 示例 - doro | `src/mods/mod-doro/` | 另一个内置 MOD 示例 |
| manifest 类型定义 | `src/core/mod.ts` | 所有 TypeScript 接口和验证逻辑 |
| 物品类型定义 | `src/core/petTypes.ts` | BuiltinItemId, ItemId, ItemEffect 等 |
| MOD 加载逻辑 | `src/core/modStorage.ts` | IndexedDB + localStorage 持久化 |
| 内置 MOD 加载 | `src/core/builtinMods.ts` | Vite import.meta.glob 自动发现 |
| 图片解析 | `src/assets.ts` | MOD 图片与内置图片的 fallback 链 |
| 物品注册 | `src/core/items.ts` | 物品注册表，MOD 覆盖 + 自定义物品合并 |
