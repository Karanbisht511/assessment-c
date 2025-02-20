import express, { Request, Response } from "express";
import { fileUpload, downloadImage, cleanDownloadFolder } from "./file.js";
import path from "path";
import ImageProcessor, {
  isProcessingResult,
  ProcessingOutput,
} from "./compressor.js";
import { saveImageToDB } from "./saveImage.js";
import { connectMongo } from "./dbConfig.js";
import { getStatus, setStatus } from "./status.js";
import { FileValidation, CSVRow } from "./fileValidation.js";
import { sendWebhookNotification } from "./webhook.js";
import { createOutputFile } from "./file.js";

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware to parse JSON requests
app.use(express.json());

// Establish db connection
connectMongo();

// serve the static files (images)
app.use("/outputImages", express.static("compressedImages"));

// upload endpoint
app.post(
  "/upload",
  fileUpload.single("file"),
  async (req: Request, res: Response) => {
    // validate if file exist
    if (!req.file || !req.file?.path) {
      res.status(404).json({ message: "File Not Found" });
    }

    const webHookURL = req.body.webhookURL;
    const imageProcessor = new ImageProcessor();
    const date = new Date();
    const requestId = `${req.file?.filename}${date.getTime()}`;
    const filePath = path.join(process.cwd(), req.file?.path!);

    try {
      //  csv validation
      const validator = new FileValidation(filePath);
      const validationResult = await validator.validate();

      if (validationResult && validationResult.errors.length > 0) {
        console.log(validationResult.errors);

        res.status(400).json({ "Bad Request": validationResult.errors });
        return;
      }

      await setStatus(requestId);
      // client receives the requestId and status
      res.send({ "request id": requestId, status: "Pending" });

      // reading the csv content
      const csvContent: CSVRow[] = await validator.parseCSV(filePath);
      console.log("csvContent:", csvContent);

      // downloading all the images from links and saving it to server downloadImage folder
      const images = await Promise.all(
        csvContent.map(async (e: CSVRow) => {
          const paths = await downloadImage(
            e["Input Image Urls"].split(",").map((e) => e.trim()),
            e["Product Name"]
          );
          return {
            productName: e["Product Name"],
            imagesPath: paths,
          };
        })
      );

      //compressing the image to 50% of quality
      const compressResponse = await Promise.all(
        images.map(async (e) => {
          return await imageProcessor.processMultipleImages(e.imagesPath);
        })
      );

      //save images to DB
      await Promise.all(
        compressResponse
          .flatMap((e: ProcessingOutput[]) => e)
          .map(async (e: ProcessingOutput) => {
            if (isProcessingResult(e)) {
              await saveImageToDB(e.outputPath, requestId);
            }
          })
      );

      //marking job as completed in DB
      await setStatus(requestId, "Completed");

      //cleanup the original images from server
      await cleanDownloadFolder();

      const imageBaseURL = `${req.protocol}://${req.get("host")}/outputImages/`;

      //create output CSV file
      const outputFile = await createOutputFile(
        filePath,
        filePath,
        JSON.stringify(compressResponse),
        imageBaseURL
      );

      //sending csv to it to webhook
      await sendWebhookNotification(
        webHookURL,
        outputFile,
        requestId,
        "Completed"
      );
    } catch (error) {
      if (error instanceof Error)
        await sendWebhookNotification(
          webHookURL,
          "",
          requestId,
          "Failed",
          error.message
        );
      res.status(500).json({ message: `Internal server error:${error}` });
    }
  }
);

app.get("/status", async (req: Request, res: Response) => {
  try {
    const status = await getStatus(req.query.requestId as string);
    if (!status) {
      res.status(404).json({ message: "RequestId not found" });
      return;
    }
    res.status(200).json({ requestId: req.query.requestId, Status: status });
  } catch (error) {
    res.status(500).json({ message: `Internal server error:${error}` });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
