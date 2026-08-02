from PIL import Image
import collections
import sys


def auto_detect_bg_color(img, sample_ratio=0.1):
    data = list(img.getdata())
    total = len(data)
    step = max(1, int(1 / sample_ratio))
    sampled = [data[i] for i in range(0, total, step)]
    counter = collections.Counter(sampled)
    return counter.most_common(1)[0][0][:3]


def analyze(img, key_color=None):
    """Analyze color distance between background and subject.

    Prints the distance histogram of all pixels vs the key color, estimates the
    background cluster boundary via density drop-off, then suggests a safe
    tolerance:

      - tolerance must cover the background:  tolerance >= bg p99
      - fade zone [tol, 2*tol] should not eat subject colors:  2*tol <= subject p10
      - recommended: midpoint of the window

    Edge-blend pixels between background and subject are usually few and being
    faded is fine (soft edges), so the window uses subject p10, not subject min.
    """
    img = img.convert("RGBA")
    data = list(img.getdata())
    total = len(data)

    if key_color is None:
        key_color = auto_detect_bg_color(img)
    kr, kg, kb = key_color

    dists = [((r - kr) ** 2 + (g - kg) ** 2 + (b - kb) ** 2) ** 0.5 for r, g, b, _ in data]
    dists.sort()

    def pct(lst, p):
        return lst[min(len(lst) - 1, int(len(lst) * p))]

    # histogram in buckets of 10
    max_d = int(dists[-1]) + 1
    buckets = collections.Counter(int(d // 10) * 10 for d in dists)

    # background boundary: first bucket whose count collapses below 15% of the
    # running mean and stays low for the next 3 buckets
    bg_boundary = max_d
    run_sum = 0
    run_n = 0
    for b in range(0, max_d, 10):
        c = buckets[b]
        run_sum += c
        run_n += 1
        mean = run_sum / run_n
        if c < mean * 0.15 and all(buckets[b + 10 * k] < mean * 0.15 for k in range(1, 4) if b + 10 * k < max_d):
            bg_boundary = b + 10
            break

    bg = [d for d in dists if d <= bg_boundary]
    subject = [d for d in dists if d > bg_boundary]
    bg_p99 = pct(bg, 0.99)
    sub_min = subject[0] if subject else 0
    sub_p10 = pct(subject, 0.1) if subject else 0

    print(f"Image: {img.size}, {total} px")
    print(f"Key color: ({kr}, {kg}, {kb})")
    print(f"Background cluster (est): {len(bg)} px ({len(bg) / total * 100:.1f}%), boundary dist <= {bg_boundary}")
    print(f"  bg dist: p50={pct(bg, 0.5):.0f} p90={pct(bg, 0.9):.0f} p95={pct(bg, 0.95):.0f} p99={bg_p99:.0f} max={bg[-1]:.0f}")
    print(f"Subject cluster: {len(subject)} px ({len(subject) / total * 100:.1f}%)")
    print(f"  min={sub_min:.0f} p10={sub_p10:.0f} p50={pct(subject, 0.5):.0f}")

    tol_low = bg_p99
    tol_high = sub_p10 / 2 if subject else tol_low
    print("\nSafe tolerance window:")
    print(f"  >= {tol_low:.0f} to cover background (bg p99)")
    print(f"  <= {tol_high:.0f} so fade zone [tol, 2*tol] avoids subject core (subject p10 / 2)")
    if tol_high > tol_low:
        recommended = int((tol_low + tol_high) / 2)
        print(f"  RECOMMENDED tolerance: {recommended}")
        print(f"  Usage: python chroma_key.py <input> <output> {kr},{kg},{kb} {recommended} 128x128 16")
    else:
        print("  WARNING: no clean window (background bleeds into subject).")
        print("  Regenerate with a purer background, or pick a manual tolerance and accept edge loss.")


def chroma_key_remove(img, key_color=None, tolerance=50, padding=0):
    img = img.convert("RGBA")
    pixels = img.load()
    w, h = img.size

    if key_color is None:
        key_color = auto_detect_bg_color(img)
    kr, kg, kb = key_color

    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            dist = ((r - kr) ** 2 + (g - kg) ** 2 + (b - kb) ** 2) ** 0.5
            if dist < tolerance:
                pixels[x, y] = (0, 0, 0, 0)
            elif dist < tolerance * 2:
                alpha_factor = (dist - tolerance) / tolerance
                pixels[x, y] = (r, g, b, int(a * alpha_factor))

    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    if padding > 0:
        padded = Image.new("RGBA", (img.width + padding * 2, img.height + padding * 2), (0, 0, 0, 0))
        padded.paste(img, (padding, padding))
        img = padded
    return img

def process(input_path, output_path, output_size=None, key_color=None, tolerance=50, padding=0):
    img = Image.open(input_path).convert("RGBA")
    img = chroma_key_remove(img, key_color, tolerance)

    if output_size:
        content_w, content_h = output_size
        img_w, img_h = img.size
        scale = min(content_w / img_w, content_h / img_h)
        new_w = max(1, round(img_w * scale))
        new_h = max(1, round(img_h * scale))
        img = img.resize((new_w, new_h), Image.NEAREST)
        canvas = Image.new("RGBA", (content_w, content_h), (0, 0, 0, 0))
        offset_x = (content_w - new_w) // 2
        offset_y = (content_h - new_h) // 2
        canvas.paste(img, (offset_x, offset_y), img)
        img = canvas

    if padding > 0:
        padded = Image.new("RGBA", (img.width + padding * 2, img.height + padding * 2), (0, 0, 0, 0))
        padded.paste(img, (padding, padding))
        img = padded

    img.save(output_path, "PNG")
    print(f"Saved: {output_path} ({img.size[0]}x{img.size[1]})")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage:")
        print("  python chroma_key.py analyze <input> [R,G,B]")
        print("    Analyze bg/subject distance and suggest a safe tolerance.")
        print("  python chroma_key.py <input> <output> [key_color] [tolerance] [output_size] [padding]")
        print("    key_color: R,G,B or 'auto' (default: auto)")
        print("    tolerance: int (default: 50)")
        print("    output_size: WxH (default: keep original)")
        print("    padding: int - transparent margin around content (default: 0)")
        sys.exit(1)

    if sys.argv[1] == "analyze":
        input_path = sys.argv[2]
        key_color = None
        if len(sys.argv) >= 4 and sys.argv[3].lower() != "auto":
            key_color = tuple(int(c) for c in sys.argv[3].split(","))
        img = Image.open(input_path)
        analyze(img, key_color)
        sys.exit(0)

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    key_color = None
    tolerance = 50
    output_size = None
    padding = 0

    if len(sys.argv) >= 4 and sys.argv[3].lower() != "auto":
        key_color = tuple(int(c) for c in sys.argv[3].split(","))
    if len(sys.argv) >= 5:
        tolerance = int(sys.argv[4])
    if len(sys.argv) >= 6:
        parts = sys.argv[5].split("x")
        output_size = (int(parts[0]), int(parts[1]))
    if len(sys.argv) >= 7:
        padding = int(sys.argv[6])

    process(input_path, output_path, output_size, key_color, tolerance, padding)