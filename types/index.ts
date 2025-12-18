export interface UploadedDocument {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadDate: string;
  webhookSent: boolean;
  webhookResponse?: string;
  webhookUrl?: string;
  status: "pending" | "processing" | "completed" | "failed";
}

export interface WebhookPayload {
  documentId: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadDate: string;
  downloadUrl?: string;
}
