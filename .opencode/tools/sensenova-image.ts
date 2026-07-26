import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Generate an image using SenseNova U1 Fast model. Returns a temporary image URL (valid for 1 hour).",
  args: {
    prompt: tool.schema.string().describe("Image description/prompt text (max 4096 tokens)"),
    size: tool.schema.string().optional().default("2752x1536").describe("Image size. Options: 2752x1536(16:9), 2048x2048(1:1), 1664x2496(2:3), 1536x2752(9:16), 2496x1664(3:2), 2368x1760(4:3), 1824x2272(4:5), 2272x1824(5:4), 3072x1376(21:9), 1344x3136(9:21). Default: 2752x1536"),
    n: tool.schema.number().optional().default(1).describe("Number of images to generate (default: 1)"),
  },
  async execute(args) {
    const apiKey = "sk-Tky33QzFHa28IY3VOCKIrndv2E2da8WF"
    const response = await fetch("https://token.sensenova.cn/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sensenova-u1-fast",
        prompt: args.prompt,
        size: args.size,
        n: args.n,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return `Error: ${response.status} - ${error}`
    }

    const data = await response.json()
    if (data.data && data.data.length > 0) {
      return `Generated ${data.data.length} image(s). URL(s):\n${data.data.map((d: { url: string }) => d.url).join("\n")}`
    }
    return `No images returned. Response: ${JSON.stringify(data)}`
  },
})
