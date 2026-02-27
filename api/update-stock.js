export default async function handler(req, res) {
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

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    // 現在のJSON取得
    const getFile = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github+json"
      }
    });

    if (!getFile.ok) {
      const text = await getFile.text();
      return res.status(500).json({ error: text });
    }

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

    const updateFile = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "auto stock update",
        content: updatedContent,
        sha: fileData.sha
      })
    });

    if (!updateFile.ok) {
      const text = await updateFile.text();
      return res.status(500).json({ error: text });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
