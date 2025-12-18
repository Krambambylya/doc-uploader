import { VercelRequest, VercelResponse } from "@vercel/node";
import { getUploadHistory } from "../utils/storage";
import { initStorage } from "../utils/storage";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await initStorage();

  // Разрешаем CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const history = await getUploadHistory();

    // Сортируем по дате (новые первые)
    const sortedHistory = history.sort(
      (a, b) =>
        new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    );

    return res.status(200).json({
      success: true,
      count: sortedHistory.length,
      uploads: sortedHistory,
    });
  } catch (error: any) {
    console.error("History error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}
