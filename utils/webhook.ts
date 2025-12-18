import axios from "axios";
import { WebhookPayload } from "../types";

export async function sendToWebhook(
  webhookUrl: string,
  payload: WebhookPayload
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await axios.post(webhookUrl, payload, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000, // 10 секунд таймаут
    });

    return {
      success: response.status >= 200 && response.status < 300,
      message: `Webhook sent successfully. Status: ${response.status}`,
    };
  } catch (error: any) {
    console.error("Webhook error:", error);
    return {
      success: false,
      message: error.message || "Failed to send webhook",
    };
  }
}
