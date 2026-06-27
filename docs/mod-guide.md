# PocPet Mod Guide

PocPet v1 mods are imported as zip files. Version 1 can replace pet images, item images, display text, the default pet name, favorite foods, and the pet's default birthday. It does not add new item IDs, change shop behavior, or extend date/festival reward pools.

## Zip Layout

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

Put `manifest.json`, `pet/`, and `items/` directly at the zip root. Do not wrap them in an extra folder.

Supported pet image files are the status images `content.png`, `hungry.png`, `sad.png`, `dirty.png`, `tired.png`, `sick.png`, `sleeping.png`, plus activity images `happy.png`, `bath.png`, `eat_cookie.png`, `eat_noodles.png`, `eat_meat.png`, `give_heart.png`, `level_up.png`, `reading_books.png`, `workout.png`, `work_food.png`, and `work_plants.png`.

Supported item image files are `emergency_biscuit.png`, `bento.png`, `orange.png`, `apple.png`, `banana.png`, `nutri_meal.png`, `pig_trotter.png`, `strawberry_cake.png`, `ad_milk.png`, `strawberry_milk.png`, `small_bouquet.png`, `shiny_sticker.png`, `soft_cloud_doll.png`, `ribbon_bell.png`, `toy_ball.png`, `picture_book.png`, `shampoo.png`, `wet_wipes.png`, `medicine.png`, `vitamin_tablet.png`, `blanket.png`, and `energy_drink.png`. The built-in special item `birthday_cake` is birthday-only and is not mod-customizable in v1.

Missing images are allowed and fall back to built-in assets. Unknown files are rejected.

## manifest.json Example

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

## Manifest Fields

- `schemaVersion`: required, must be `1`.
- `id`: required, 2-64 chars, lowercase letters, numbers, dots, dashes, or underscores.
- `name`: required display name, max 48 chars.
- `author`: optional author name, max 48 chars.
- `version`: required version like `1.0.0`, max 32 chars.
- `defaultPetName`: required pet name, max 16 chars.
- `description`: optional summary, max 160 chars.
- `favoriteFoodIds`: optional list of existing item IDs; duplicates are removed.
- `birthday`: optional `{ "month": number, "day": number }` using a valid calendar date.
- `texts.recentEvent`: optional import/switch message, max 240 chars.
- `texts.favoriteFood`: optional favorite food message. Use `{amount}` for the bonus mood amount.
- `texts.status`: optional labels for existing pet status IDs, max 24 chars each.
- `texts.items`: optional item names and summaries for existing item IDs. Names are max 28 chars; summaries are max 96 chars.

A Mod birthday is the pet's default birthday. Users can edit the current pet birthday in Settings, and that edit is kept until the next app startup with an active Mod, save import with a matching active Mod, restore, reset, or Mod switch reapplies the active Mod manifest birthday. If a Mod has no `birthday`, that Mod does not provide a birthday default.

## Image Guidelines

- Use PNG images; transparent backgrounds work best.
- Pet images should use a square canvas, ideally 512x512 or larger, with the subject centered.
- Item icons should be 256x256 or 128x128.
- Each image must be 3MB or smaller; the full zip must be 25MB or smaller.

## Packaging Steps

1. Prepare `manifest.json`, `pet/`, and `items/` at the zip root.
2. Zip those files directly; do not wrap them in an extra folder.
3. Open PocPet settings and choose Import Pet Mod.
4. If the app reports missing images, those slots use built-in assets.

## Compatibility

- v1 mods cannot add or remove item IDs.
- v1 mods cannot change item prices, item effects, shop categories, coins, hearts, levels, Pomodoro rules, daily wish rules, return welcome rules, save rules, or offline rules.
- v1 mods cannot add festival-exclusive items, customize the built-in `birthday_cake`, or define birthday, festival, daily login, daily wish, return welcome, anniversary, monthly gift, seasonal effect, or year review content yet.
- Save export includes current data and a Mod summary, but does not include Mod images. Re-import the zip on another device before or after importing the save.
