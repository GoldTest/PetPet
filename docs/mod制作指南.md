# PocPet Mod 制作指南

PocPet v1 Mod 通过 zip 导入。第一版可以替换宠物图片、道具图片、显示文本、默认宠物名字、喜欢食物和宠物默认生日；不能新增道具 ID、修改商店行为，也不能扩展日期或节日奖励池。

## Zip 结构

```text
my-pet-mod.zip
|- manifest.json
|- pet/content.png
|- pet/hungry.png
|- pet/sad.png
|- pet/dirty.png
|- pet/tired.png
|- pet/sick.png
|- pet/sleeping.png
|- pet/happy.png
|- pet/bath.png
|- pet/eat_cookie.png
|- pet/eat_noodles.png
|- pet/eat_meat.png
|- pet/give_heart.png
|- pet/level_up.png
|- pet/reading_books.png
|- pet/workout.png
|- pet/work_food.png
|- pet/work_plants.png
`- items/*.png
```

请把 `manifest.json`、`pet/` 和 `items/` 直接放在 zip 根目录，不要在 zip 里再套一层外部文件夹。

宠物图片支持这些固定文件名：状态图片 `content.png`、`hungry.png`、`sad.png`、`dirty.png`、`tired.png`、`sick.png`、`sleeping.png`，以及活动图片 `happy.png`、`bath.png`、`eat_cookie.png`、`eat_noodles.png`、`eat_meat.png`、`give_heart.png`、`level_up.png`、`reading_books.png`、`workout.png`、`work_food.png`、`work_plants.png`。

`items` 目录支持这些固定文件名：`emergency_biscuit.png`、`bento.png`、`orange.png`、`apple.png`、`banana.png`、`nutri_meal.png`、`pig_trotter.png`、`strawberry_cake.png`、`ad_milk.png`、`strawberry_milk.png`、`small_bouquet.png`、`shiny_sticker.png`、`soft_cloud_doll.png`、`ribbon_bell.png`、`toy_ball.png`、`picture_book.png`、`shampoo.png`、`wet_wipes.png`、`medicine.png`、`vitamin_tablet.png`、`blanket.png`、`energy_drink.png`。内置特殊道具 `birthday_cake` 只通过生日获得，v1 暂不支持 Mod 自定义。

缺少图片不会导致导入失败，对应位置会回退到内置资源；zip 里出现未知文件会被拒绝。

## manifest.json 示例

```json
{
  "schemaVersion": 1,
  "id": "creator.momo",
  "name": "Momo Pack",
  "author": "Creator",
  "version": "1.0.0",
  "defaultPetName": "Momo",
  "description": "A custom pet for PocPet.",
  "favoriteFoodIds": ["strawberry_cake", "ad_milk"],
  "birthday": { "month": 4, "day": 23 },
  "texts": {
    "recentEvent": "Momo is here with a biscuit in the bag.",
    "favoriteFood": "Momo loves this flavor. Mood +{amount}.",
    "status": {
      "content": "Doing well",
      "hungry": "Hungry",
      "sad": "A little sad",
      "dirty": "Needs cleaning",
      "tired": "Tired",
      "sick": "Unwell",
      "sleeping": "Sleeping"
    },
    "items": {
      "strawberry_cake": {
        "name": "Berry Cake",
        "summary": "Momo's favorite sweet snack."
      }
    }
  }
}
```

## Manifest 字段

- `schemaVersion`：必填，必须是 `1`。
- `id`：必填，2-64 个字符，只能使用小写字母、数字、点、短横线或下划线。
- `name`：必填，Mod 显示名，最多 48 个字符。
- `author`：选填，作者名，最多 48 个字符。
- `version`：必填，形如 `1.0.0`，最多 32 个字符。
- `defaultPetName`：必填，默认宠物名，最多 16 个字符。
- `description`：选填，简介，最多 160 个字符。
- `favoriteFoodIds`：选填，已有道具 ID 列表；重复项会被去重。
- `birthday`：选填，格式为 `{ "month": number, "day": number }`，必须是有效日期。
- `texts.recentEvent`：选填，导入或切换后的动态文本，最多 240 个字符。
- `texts.favoriteFood`：选填，喜欢食物提示文本，可以用 `{amount}` 表示额外心情值。
- `texts.status`：选填，已有宠物状态 ID 的显示文本，每项最多 24 个字符。
- `texts.items`：选填，已有道具 ID 的名称和说明；名称最多 28 个字符，说明最多 96 个字符。

Mod 里的生日是宠物默认生日。用户可以在设置页修改当前宠物生日；该修改会保留到下一次有当前 Mod 的应用启动、匹配当前 Mod 的存档导入、恢复、重置或切换 Mod 时，再重新按当前 Mod manifest 里的生日覆盖。没有 `birthday` 的 Mod 不提供默认生日。

## 图片建议

- 使用 PNG 图片，透明背景效果最好。
- 宠物图片建议使用正方形画布，512x512 或更高，主体居中。
- 道具图标建议使用 256x256 或 128x128。
- 单张图片必须小于等于 3MB，整个 zip 必须小于等于 25MB。

## 打包步骤

1. 在 zip 根目录准备 `manifest.json`、`pet/` 和 `items/`。
2. 直接压缩这些文件，不要在 zip 里多包一层外部文件夹。
3. 在 PocPet 设置中选择导入宠物 Mod。
4. 如果提示缺少图片，对应位置会使用内置资源。

## 兼容说明

- v1 Mod 不能新增或删除道具 ID。
- v1 Mod 不能修改道具价格、道具效果、商店分类、金币、小心心、等级、番茄钟、每日小愿望、回归欢迎、存档规则或离线规则。
- v1 Mod 暂时不能新增节日专属道具，也不能自定义内置 `birthday_cake`，不能自定义生日、节日、每日登录、每日愿望、回归欢迎、纪念日、月初礼物、季节效果或年度回顾内容。
- 存档导出只包含当前数据和 Mod 摘要，不包含 Mod 图片；换设备恢复时需要在导入存档前后重新导入 Mod zip。
