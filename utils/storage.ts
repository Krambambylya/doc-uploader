import fs from "fs/promises";
import path from "path";
import { UploadedDocument } from "../types";

const DATA_FILE = path.join(process.cwd(), "data", "uploads.json");
const UPLOADS_DIR = path.join(process.cwd(), "data", "uploads");

// Инициализация директорий
export async function initStorage() {
  try {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.mkdir(UPLOADS_DIR, { recursive: true });

    // Создаем файл данных если не существует
    try {
      await fs.access(DATA_FILE);
    } catch {
      await fs.writeFile(DATA_FILE, JSON.stringify([]));
    }
  } catch (error) {
    console.error("Storage init error:", error);
  }
}

// Сохранение информации о загрузке
export async function saveUploadInfo(
  document: UploadedDocument
): Promise<void> {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    const uploads: UploadedDocument[] = JSON.parse(data);
    uploads.push(document);
    await fs.writeFile(DATA_FILE, JSON.stringify(uploads, null, 2));
  } catch (error) {
    console.error("Save upload info error:", error);
    throw error;
  }
}

// Получение истории загрузок
export async function getUploadHistory(): Promise<UploadedDocument[]> {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Get history error:", error);
    return [];
  }
}

// Сохранение файла
export async function saveFile(
  file: Buffer,
  filename: string
): Promise<string> {
  const filepath = path.join(UPLOADS_DIR, filename);
  await fs.writeFile(filepath, file);
  return `/api/download/${filename}`;
}
