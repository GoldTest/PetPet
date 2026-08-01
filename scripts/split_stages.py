"""split_stages.py - 多阶段拼图切分工具

将一张"N 棵同画风树水平排列"的拼图（品红背景）抠图并动态切分为 N 张独立图标。

用法:
  python scripts/split_stages.py <input.png> <out_dir> [--prefix <name>] [--count 5]
      [--tolerance 90] [--out-size 512] [--fill-ratio 0.9] [--align bottom] [--gap-ratio 0.05]

参数:
  input        拼图原图（品红背景 #FF00FF，内容水平排列）
  out_dir      输出目录（每张输出 <prefix>_1.png ... <prefix>_N.png）
  prefix       输出文件名前缀，默认 "stage"
  count        拼图中的树数量（默认 5）
  tolerance    chroma_key 抠图容差（默认 90；AI 背景可能非纯品红，实测 60 不足）
  out-size     输出画布边长（默认 512）
  fill-ratio   最大树占画布比例（默认 0.9）；所有树共享同一缩放系数，
               保持拼图内的相对大小递进（勿用统一放大，会抹平阶段区分度）
  align        垂直对齐：bottom=树根对齐画布底缘（默认），center=垂直居中
  bottom-margin 底部对齐时距画布底缘留白（默认 24）
  gap-ratio    低谷判定采样比例（默认 0.05）
"""
from PIL import Image
import sys
import os
import argparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chroma_key import chroma_key_remove


def find_split_boundaries(img, count, gap_ratio, low_threshold=None, merge_gap=8):
    """按列投影找 count-1 个最宽低谷作为切分边界。返回边界列索引列表（升序）。

    用严格不透明像素（A>200）计数，避免抗锯齿边缘像素污染低谷判定。
    low_threshold: 低谷计数阈值，默认 max(3, min(15, 20% 全局最大))
    merge_gap: 相邻低谷段合并的最大间距（默认 8px，树冠稀疏区可能把空隙切成小段）
    """
    w, h = img.size
    pixels = img.load()
    step = 4  # 采样步长，减少边缘抗锯齿像素干扰
    col_opaque = [0] * w
    for x in range(w):
        n = 0
        for y in range(0, h, step):
            if pixels[x, y][3] > 200:
                n += 1
        col_opaque[x] = n

    if low_threshold is None:
        max_col = max(col_opaque)
        # 低谷阈值：取全局最大计数的 20%，但限制在 [3, 15] 区间
        low_threshold = max(3, min(15, int(max_col * 0.2)))
    # 找低谷段：连续列 opaque 数低于阈值
    gaps = []  # (start, end, width)
    in_gap = False
    start = 0
    for x in range(w):
        if col_opaque[x] < low_threshold:
            if not in_gap:
                in_gap = True
                start = x
        else:
            if in_gap:
                gaps.append((start, x - 1))
                in_gap = False
    if in_gap:
        gaps.append((start, w - 1))

    # 合并间距 <= merge_gap 的相邻低谷段（树冠稀疏区可能把空隙切成小段）
    merged = []
    for g in gaps:
        if merged and g[0] - merged[-1][1] <= merge_gap:
            merged[-1] = (merged[-1][0], g[1])
        else:
            merged.append(g)
    gaps = merged

    need = count - 1
    # 去掉贴边低谷（画布最左/最右的空白不算内部切分点）
    interior = [g for g in gaps if g[0] > 0 and g[1] < w - 1]
    interior.sort(key=lambda g: g[1] - g[0], reverse=True)
    # 以低谷段中点作为切分边界，给相邻树对称的裁切空间
    boundaries = sorted((g[0] + g[1]) // 2 for g in interior[:need])
    return boundaries, col_opaque


def split_sheet(img, count, gap_ratio, low_threshold=None, merge_gap=8):
    """切分拼图。返回 count 张裁剪后的透明图（保持原始相对大小）。"""
    w, h = img.size
    boundaries, col_opaque = find_split_boundaries(img, count, gap_ratio, low_threshold, merge_gap)
    if len(boundaries) < count - 1:
        print(f"WARN: 只找到 {len(boundaries)} 个空隙（需要 {count - 1}），退化为等分")
        boundaries = [round(w * (i + 1) / count) for i in range(count - 1)]

    slices = []
    starts = [0] + [b + 1 for b in boundaries]
    ends = boundaries + [w]
    for i in range(count):
        # 每段左右各扩展 2px 余量，防止切掉边缘抗锯齿
        x0 = max(0, starts[i] - 2)
        x1 = min(w, ends[i] + 2)
        chunk = img.crop((x0, 0, x1, h))
        bbox = chunk.getbbox()
        if not bbox:
            print(f"WARN: 第 {i + 1} 段为空内容")
            slices.append(chunk)
            continue
        slices.append(chunk.crop(bbox))
    return slices


def to_canvas(img, out_size, scale, align="bottom", bottom_margin=24):
    """按统一缩放系数等比缩放，粘贴到 out_size 画布。

    所有切片共享同一 scale，保持拼图内的相对大小比例（成长递进不丢失）。
    align="bottom": 底部对齐画布底缘（树根在同一水平线，默认）
    align="center": 垂直居中
    """
    w, h = img.size
    new_w = max(1, round(w * scale))
    new_h = max(1, round(h * scale))
    img = img.resize((new_w, new_h), Image.NEAREST)
    canvas = Image.new("RGBA", (out_size, out_size), (0, 0, 0, 0))
    x = (out_size - new_w) // 2
    if align == "center":
        y = (out_size - new_h) // 2
    else:
        y = max(0, out_size - new_h - bottom_margin)
    canvas.paste(img, (x, y), img)
    return canvas


def content_ratio(img):
    w, h = img.size
    pixels = img.load()
    opaque = 0
    for y in range(h):
        for x in range(w):
            if pixels[x, y][3] > 10:
                opaque += 1
    return opaque / (w * h)


def main():
    parser = argparse.ArgumentParser(description="多阶段拼图切分工具")
    parser.add_argument("input")
    parser.add_argument("out_dir")
    parser.add_argument("--prefix", default="stage")
    parser.add_argument("--count", type=int, default=5)
    parser.add_argument("--tolerance", type=int, default=60)
    parser.add_argument("--out-size", type=int, default=512)
    parser.add_argument("--fill-ratio", type=float, default=0.9,
                        help="最大树占画布的比例（默认 0.9）；所有树共享同一缩放系数，保持相对大小")
    parser.add_argument("--align", choices=["bottom", "center"], default="bottom",
                        help="垂直对齐方式（默认 bottom：树根对齐画布底缘）")
    parser.add_argument("--bottom-margin", type=int, default=24,
                        help="底部对齐时距画布底缘的留白像素（默认 24）")
    parser.add_argument("--gap-ratio", type=float, default=0.05)
    parser.add_argument("--low-threshold", type=int, default=None,
                        help="低谷计数阈值（默认自动：20pct 全局最大，限 3-15；窄缝场景可调大如 25）")
    parser.add_argument("--merge-gap", type=int, default=8,
                        help="相邻低谷段合并最大间距像素（默认 8）")
    args = parser.parse_args()

    os.makedirs(args.out_dir, exist_ok=True)
    img = Image.open(args.input).convert("RGBA")
    img = chroma_key_remove(img, None, args.tolerance)

    slices = split_sheet(img, args.count, args.gap_ratio, args.low_threshold, args.merge_gap)
    # 统一缩放系数：最大切片（按最长边）放大到 fill_ratio 画布
    max_side = max(max(s.size) for s in slices)
    scale = args.fill_ratio * args.out_size / max_side
    for i, chunk in enumerate(slices):
        out = os.path.join(args.out_dir, f"{args.prefix}_{i + 1}.png")
        canvas = to_canvas(chunk, args.out_size, scale, args.align, args.bottom_margin)
        canvas.save(out, "PNG")
        print(f"Saved: {out} ({args.out_size}x{args.out_size}) 内容占比={content_ratio(canvas) * 100:.1f}%")


if __name__ == "__main__":
    main()
