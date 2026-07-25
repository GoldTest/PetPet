export const synergyRulesTable = [
  {
    id: 'fruit_care',
    treeA: 'fruit_tree',
    treeB: 'care_tree',
    effect: 'care_tree extra drop +100%',
    description: '果树与护理之树相邻，护理之树额外掉落概率+100%',
  },
  {
    id: 'gift_fruit',
    treeA: 'gift_tree',
    treeB: 'fruit_tree',
    effect: 'fruit_tree grow speed +10%',
    description: '礼物树与果树相邻，果树生长速度+10%',
  },
  {
    id: 'money_adjacent',
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
