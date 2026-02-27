export default async function handler(req, res) {

  // ⭐ CORS許可（最重要）
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ⭐ preflight対応
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const { id, delta } = req.body;

    if (!id || typeof delta !== "number") {
      return res.status(400).json({ error: "Invalid request" });
    }

    const token = process.env.GITHUB_TOKEN;
    const owner = "rune0000";
    const repo = "tanupon";
    const path = "docs/data/items.json";

    // 現在ファイル取得
    const getFile = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json"
        }
      }
    );

    const fileData = await getFile.json();

    const items = JSON.parse(
      Buffer.from(fileData.content, "base64").toString()
    );

    const item = items.find(x => x.id === id);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    item.available = Math.max(0, item.available + delta);

    const updatedContent = Buffer
      .from(JSON.stringify(items, null, 2))
      .toString("base64");

    // GitHubへ保存
    await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: "auto stock update",
          content: updatedContent,
          sha: fileData.sha
        })
      }
    );

    return res.status(200).json({ success: true });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
