import axios from "axios";
import FormData from "form-data";
import fs from "fs";

export async function sendWebhookNotification(
  url: string,
  outputFile: string,
  requestId: string,
  status: string = "Failed",
  error: string = ""
) {
  try {
    const form = new FormData();
    form.append("file", fs.readFileSync(outputFile));
    form.append("requestId", requestId);
    form.append("status", status);
    form.append("error", error);
    await axios.post(url, form, {
      headers: form.getHeaders(),
    });
    console.log(`Webhook notification sent to ${url}`);
  } catch (error) {
    if (error instanceof Error)
      console.error(`Webhook notification failed to ${url}:`, error.message);
  }
}
