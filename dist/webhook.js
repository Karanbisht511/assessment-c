var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
export function sendWebhookNotification(url_1, outputFile_1, requestId_1) {
    return __awaiter(this, arguments, void 0, function* (url, outputFile, requestId, status = "Failed", error = "") {
        try {
            const form = new FormData();
            form.append("file", fs.readFileSync(outputFile));
            form.append("requestId", requestId);
            form.append("status", status);
            form.append("error", error);
            yield axios.post(url, form, {
                headers: form.getHeaders(),
            });
            console.log(`Webhook notification sent to ${url}`);
        }
        catch (error) {
            if (error instanceof Error)
                console.error(`Webhook notification failed to ${url}:`, error.message);
        }
    });
}
//# sourceMappingURL=webhook.js.map