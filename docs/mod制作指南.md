# PocPet Mod 制作指南

PocPet Mod 是一个 zip 包，根目录必须直接包含 `manifest.json`，可选包含 `pet/` 和 `items/`。不要在 zip 里再套一层外部文件夹。

当前支持两种 manifest：

- `schemaVersion: 1`：替换宠物图片、内置道具图片、文本、默认宠物名、喜欢食物和默认生日。
- `schemaVersion: 2`：兼容 v1，并支持覆盖内置道具显示，以及新增可购买、可使用的自定义道具。

## 目录结构

```text
my-mod.zip
|- manifest.json
|- pet/content.png
|- pet/hungry.png
`- items/*.png
```

支持的宠物图片完整路径：

`pet/content.png`、`pet/hungry.png`、`pet/sad.png`、`pet/dirty.png`、`pet/tired.png`、`pet/sick.png`、`pet/sleeping.png`、`pet/happy.png`、`pet/bath.png`、`pet/eat_cookie.png`、`pet/eat_noodles.png`、`pet/eat_meat.png`、`pet/give_heart.png`、`pet/level_up.png`、`pet/reading_books.png`、`pet/workout.png`、`pet/work_food.png`、`pet/work_plants.png`。

支持覆盖的内置道具图片完整路径：

`items/emergency_biscuit.png`、`items/bento.png`、`items/orange.png`、`items/apple.png`、`items/banana.png`、`items/watermelon.png`、`items/nutri_meal.png`、`items/pig_trotter.png`、`items/strawberry_cake.png`、`items/ad_milk.png`、`items/strawberry_milk.png`、`items/small_bouquet.png`、`items/shiny_sticker.png`、`items/soft_cloud_doll.png`、`items/ribbon_bell.png`、`items/toy_ball.png`、`items/picture_book.png`、`items/shampoo.png`、`items/wet_wipes.png`、`items/medicine.png`、`items/vitamin_tablet.png`、`items/blanket.png`、`items/energy_drink.png`。

对应的内置道具 ID 就是文件名去掉 `items/` 和 `.png` 后的部分，例如 `items/watermelon.png` 对应 `watermelon`。

`birthday_cake` 是生日特殊道具，不能由 Mod 覆盖。

## v2 示例

推荐新 Mod 使用 `schemaVersion: 2`。

```json
{
  "schemaVersion": 2,
  "id": "creator.farm",
  "name": "Farm Pack",
  "author": "Creator",
  "version": "1.0.0",
  "defaultPetName": "Momo",
  "description": "Farm themed items.",
  "favoriteFoodIds": ["strawberry_cake"],
  "birthday": { "month": 4, "day": 23 },
  "texts": {
    "recentEvent": "Momo brought a seed packet.",
    "favoriteFood": "Momo loves this flavor. Mood +{amount}.",
    "status": {
      "content": "状态不错"
    }
  },
  "items": {
    "overrides": {
      "watermelon": {
        "name": "像素西瓜",
        "summary": "清甜的夏日水果。",
        "image": "items/watermelon.png"
      }
    },
    "custom": [
      {
        "id": "creator.farm:melon_seed",
        "name": "瓜种",
        "summary": "可以留给后续种植系统使用。",
        "kind": "item",
        "price": 30,
        "effect": { "mood": 2 },
        "image": "items/creator.farm_melon_seed.png",
        "shop": true,
        "tags": ["planting", "seed", "watermelon"]
      }
    ]
  }
}
```

## 字段规则

- `id`：2-64 个字符，只能用小写字母、数字、点、短横线、下划线。
- `name`：最多 48 个字符。
- `author`：可选，最多 48 个字符。
- `version`：例如 `1.0.0`，最多 32 个字符。
- `defaultPetName`：最多 16 个字符。
- `description`：可选，最多 160 个字符。
- `favoriteFoodIds`：只能引用内置道具 ID。
- `birthday`：可选，格式为 `{ "month": 4, "day": 23 }`，必须是有效日期。
- `texts.status`：只能覆盖已有宠物状态文本，每项最多 24 个字符。
- `items.overrides`：只能覆盖内置道具的 `name`、`summary`、`image`。

## 自定义道具规则

`items.custom` 只在 v2 可用。

- `id` 必须以当前 Mod ID 开头，例如 `creator.farm:melon_seed`。
- 冒号后的本地 ID 只能使用小写字母、数字、短横线、下划线。
- `kind` 只能是 `food`、`item`、`care`。
- `price` 必须是 `0..9999`。
- `effect` 只能包含 `hunger`、`mood`、`cleanliness`、`energy`、`health`，每个数值必须在 `-100..100`。
- `image` 必须是 `items/*.png`；缺图会用占位图，但 zip 中不能出现未被 manifest 引用的自定义图片。
- `shop: true` 表示进入商店；`false` 表示只在获得后出现在背包。
- `tags` 会被保留，供后续种植、奖励池等系统使用。

自定义道具不会参与“所有商店道具”“水果大师”等固定内置集合成就，但购买次数、使用次数这类总量统计可以累计。

## 图片与导入限制

- 图片必须是 PNG。
- 单张图片不超过 3MB。
- 整个 zip 不超过 25MB。
- 缺少 manifest 引用的图片不会导入失败，会回退内置图或占位图。
- zip 中出现未知文件、未允许路径或路径套壳会导入失败。

## 存档兼容

存档只保存当前数据和 Mod 摘要，不包含 Mod 图片。换设备恢复时，需要重新导入 Mod zip。

如果背包里有当前未加载 Mod 的自定义道具，数量会保留，并显示为“未知 Mod 道具”；重新导入提供相同 ID 的 Mod 后会恢复显示和使用。
