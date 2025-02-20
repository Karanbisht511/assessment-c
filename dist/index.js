var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from "express";
import { fileUpload, downloadImage, cleanDownloadFolder } from "./file.js";
import path from "path";
import ImageProcessor, { isProcessingResult, } from "./compressor.js";
import { saveImageToDB } from "./saveImage.js";
import { connectMongo } from "./dbConfig.js";
import { getStatus, setStatus } from "./status.js";
import { FileValidation } from "./fileValidation.js";
import { sendWebhookNotification } from "./webhook.js";
import { createOutputFile } from "./file.js";
const app = express();
const PORT = process.env.PORT || 8080;
// Middleware to parse JSON requests
app.use(express.json());
connectMongo();
app.use("/outputImages", express.static("compressedImages"));
app.post("/upload", fileUpload.single("file"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    // validate file
    if (!req.file || !((_a = req.file) === null || _a === void 0 ? void 0 : _a.path)) {
        res.status(404).json({ message: "File Not Found" });
    }
    const webHookURL = req.body.webhookURL;
    const imageProcessor = new ImageProcessor();
    const date = new Date();
    const requestId = `${(_b = req.file) === null || _b === void 0 ? void 0 : _b.filename}${date.getTime()}`;
    const filePath = path.join(process.cwd(), (_c = req.file) === null || _c === void 0 ? void 0 : _c.path);
    console.log("filePath", filePath);
    try {
        const validator = new FileValidation(filePath);
        const validationResult = yield validator.validate();
        console.log(validationResult);
        if (validationResult && validationResult.errors.length > 0) {
            console.log(validationResult.errors);
            res.status(400).json({ "Bad Request": validationResult.errors });
            return;
        }
        yield setStatus(requestId);
        res.send({ "request id": requestId, status: "Pending" });
        const csvContent = yield validator.parseCSV(filePath);
        console.log("csvContent:", csvContent);
        const images = yield Promise.all(csvContent.map((e) => __awaiter(void 0, void 0, void 0, function* () {
            const paths = yield downloadImage(e["Input Image Urls"].split(",").map((e) => e.trim()), e["Product Name"]);
            return {
                productName: e["Product Name"],
                imagesPath: paths,
            };
        })));
        const compressResponse = yield Promise.all(images.map((e) => __awaiter(void 0, void 0, void 0, function* () {
            return yield imageProcessor.processMultipleImages(e.imagesPath);
        })));
        yield Promise.all(compressResponse
            .flatMap((e) => e)
            .map((e) => __awaiter(void 0, void 0, void 0, function* () {
            if (isProcessingResult(e)) {
                yield saveImageToDB(e.outputPath, requestId);
            }
        })));
        yield setStatus(requestId, "Completed");
        yield cleanDownloadFolder();
        const imageBaseURL = `${req.protocol}://${req.get("host")}/outputImages/`;
        //creat output CSV file
        const outputFile = yield createOutputFile(filePath, filePath, JSON.stringify(compressResponse), imageBaseURL);
        // send it to webhook
        yield sendWebhookNotification(webHookURL, outputFile, requestId, "Completed");
    }
    catch (error) {
        if (error instanceof Error)
            yield sendWebhookNotification(webHookURL, "", requestId, "Failed", error.message);
        res.status(500).json({ message: `Internal server error:${error}` });
    }
}));
app.get("/status", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const status = yield getStatus(req.query.requestId);
        if (!status) {
            res.status(404).json({ message: "RequestId not found" });
            return;
        }
        res.status(200).json({ requestId: req.query.requestId, Status: status });
    }
    catch (error) {
        res.status(500).json({ message: `Internal server error:${error}` });
    }
}));
// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map