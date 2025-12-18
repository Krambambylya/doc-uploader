import { VercelRequest, VercelResponse } from "@vercel/node";
import multer from "multer";
import { initStorage, saveFile, saveUploadInfo } from "../utils/storage";
import { sendToWebhook } from "../utils/webhook";
import { UploadedDocument, WebhookPayload } from "../types";
import { v4 as uuidv4 } from "uuid";

// Настройка multer для обработки файлов в памяти
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB лимит
  },
});

// Включаем middleware для обработки multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Инициализация хранилища
  await initStorage();

  // Только POST запросы
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Используем multer для обработки файла
  const multerSingle = upload.single("document");

  multerSingle(req as any, res as any, async (err: any) => {
    if (err) {
      return res.status(400).json({
        error: "File upload failed",
        details: err.message,
      });
    }

    const file = (req as any).file;
    const webhookUrl = req.body.webhookUrl;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      // Генерируем уникальный ID
      const documentId = uuidv4();
      const filename = `${documentId}_${file.originalname}`;

      // Сохраняем файл
      const downloadUrl = await saveFile(file.buffer, filename);

      // Создаем запись о документе
      const document: UploadedDocument = {
        id: documentId,
        filename: filename,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        uploadDate: new Date().toISOString(),
        webhookSent: false,
        status: "pending",
      };

      // Если указан вебхук, отправляем
      if (webhookUrl && webhookUrl.startsWith("http")) {
        document.webhookUrl = webhookUrl;
        document.status = "processing";

        const webhookPayload: WebhookPayload = {
          documentId,
          filename: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
          uploadDate: document.uploadDate,
          downloadUrl,
        };

        const webhookResult = await sendToWebhook(webhookUrl, webhookPayload);

        document.webhookSent = true;
        document.webhookResponse = webhookResult.message;
        document.status = webhookResult.success ? "completed" : "failed";
      } else {
        document.status = "completed";
      }

      // Сохраняем информацию
      await saveUploadInfo(document);

      // Возвращаем ответ
      return res.status(200).json({
        success: true,
        documentId,
        filename: file.originalname,
        size: file.size,
        downloadUrl,
        webhookSent: !!webhookUrl,
        webhookResponse: document.webhookResponse,
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      return res.status(500).json({
        error: "Internal server error",
        details: error.message,
      });
    }
  });
}
