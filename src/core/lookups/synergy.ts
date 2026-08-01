export const synergyRulesTable = [
  {
    id: 'herb_fruit',
    treeA: 'herb_tree',
    treeB: 'fruit_tree',
    effect: 'extra drop +50%',
    description: '药草树与果树相邻，果树额外掉落+50%',
  },
  {
    id: 'money_any',
    treeA: 'money_tree',
    treeB: 'any',
    effect: 'coin bonus +15%',
    description: '摇钱树与任意树相邻，收获金币+15%',
  },
  {
    id: 'same_adjacent',
    treeA: 'same',
    treeB: 'same',
    effect: 'rare weight +5%',
    description: '同种树相邻，稀有掉落权重+5%',
  },
] as const;
