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
        img = img.resize(output_size, Image.NEAREST)

    if padding > 0:
        padded = Image.new("RGBA", (img.width + padding * 2, img.height + padding * 2), (0, 0, 0, 0))
        padded.paste(img, (padding, padding))
        img = padded

    img.save(output_path, "PNG")
    print(f"Saved: {output_path} ({img.size[0]}x{img.size[1]})")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python chroma_key.py <input> <output> [key_color] [tolerance] [output_size] [padding]")
        print("  key_color: R,G,B or 'auto' (default: auto)")
        print("  tolerance: int (default: 50)")
        print("  output_size: WxH (default: keep original)")
        print("  padding: int - transparent margin around content (default: 0)")
        sys.exit(1)

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