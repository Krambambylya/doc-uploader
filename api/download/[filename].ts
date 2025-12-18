import { VercelRequest, VercelResponse } from "@vercel/node";
import fs from "fs/promises";
import path from "path";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { filename } = req.query;

  if (!filename || typeof filename !== "string") {
    return res.status(400).json({ error: "Filename is required" });
  }

  const filepath = path.join(process.cwd(), "data", "uploads", filename);

  try {
    await fs.access(filepath);
    const fileBuffer = await fs.readFile(filepath);

    // Определяем Content-Type
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".pdf": "application/pdf",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".txt": "text/plain",
      ".doc": "application/msword",
      ".docx":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };

    res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename.split("_").slice(1).join("_")}"`
    );

    return res.send(fileBuffer);
  } catch (error) {
    return res.status(404).json({ error: "File not found" });
  }
}
