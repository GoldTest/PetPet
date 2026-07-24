/**
 * AI 快查表统一导出
 *
 * 这些表供 AI 读取/写入，用于全局状态/事件/物品/天气/季节/操作的快速查询。
 * 所有表均为纯结构化数据，不含运行时逻辑。
 */

export { STATUS_TABLE, STATUS_PRIORITY } from './status';
export type { StatusEntry } from './status';

export { EVENT_TABLE } from './events';
export type { EventEntry } from './events';

export { ACTION_TABLE, OVERUSE_THRESHOLDS } from './actions';
export type { ActionEntry } from './actions';

/** 物品表为 JSON 格式，直接 import */
export { default as items } from './items.json';

/** 天气表为 JSON 格式，直接 import */
export { default as weather } from './weather.json';

/** 季节表为 JSON 格式，直接 import */
export { default as seasons } from './season.json';