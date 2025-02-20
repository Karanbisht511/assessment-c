import multer from "multer";
import fs from "fs";
import path from "path";
import axios from "axios";
import { fileTypeFromBuffer } from "file-type";
import csv from "csv-parser";
import { ProcessingResult } from "./compressor.js";
import { CSVRow } from "./fileValidation.js";
import { createObjectCsvWriter } from "csv-writer";

const downloadDir = "downloadImages";

// Configure multer to save files
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = "csvFiles/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    cb(null, `${file.originalname}`);
  },
});

export const fileUpload = multer({ storage });

export const downloadImage = async (
  imagURLs: string[],
  fileName: string
): Promise<string[]> => {
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir);
  }
  try {
    return await Promise.all(
      imagURLs.map(async (e, index) => {
        const response = await axios.get(e, {
          responseType: "arraybuffer",
          headers: {
            Accept: "*/*",
            "User-Agent": "Mozilla/5.0", // Some servers require a user agent
          },
        });
        const fileTypeResult = await fileTypeFromBuffer(response.data);

        if (!fileTypeResult) {
          throw new Error("Could not determine file type");
        }
        const filePath = path.join(
          process.cwd(),
          downloadDir,
          `${fileName}${index}.${fileTypeResult.ext}`
        );

        fs.writeFileSync(filePath, response.data);
        return filePath;
      })
    );
  } catch (error) {
    console.error("Error downloading image:", error);
    throw error;
  }
};

export const cleanDownloadFolder = async () => {
  try {
    const files = fs.readdirSync(downloadDir);
    await Promise.all(
      files.map((file) => fs.unlinkSync(path.join(downloadDir, file)))
    );
    console.log(`Cleaned directory: ${downloadDir}`);
  } catch (error) {
    console.error(`Error cleaning directory ${downloadDir}:`, error);
  }
};

export async function createOutputFile(
  inputFile: string,
  outputFile: string,
  processedData: string,
  basePath: string
) {
  // Read existing CSV and store rows
  const rows: CSVRow[] = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(inputFile)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", resolve)
      .on("error", reject);
  });

  const outputfileName = "output-" + outputFile.split("/").slice(-1)[0];
  outputFile = path.join(path.dirname(outputFile), outputfileName);

  const data: [][] = JSON.parse(processedData);

  // Map processed output paths to corresponding rows
  const updatedRows = rows.map((row, index) => {
    const outputPaths = data[index]
      ? data[index]
          .map(
            (item: ProcessingResult) =>
              `${basePath}/${item.outputPath.split("/")[1]}`
          )
          .join(", ")
      : "";

    return {
      ...row,
      "Output Image Urls": outputPaths,
    };
  });

  // Define CSV writer with original columns plus new output column
  const csvWriter = createObjectCsvWriter({
    path: outputFile,
    header: [
      { id: "S. No.", title: "S. No." },
      { id: "Product Name", title: "Product Name" },
      { id: "Input Image Urls", title: "Input Image Urls" },
      { id: "Output Image Urls", title: "Output Image Urls" },
    ],
  });

  // Write updated data to new CSV
  await csvWriter.writeRecords(updatedRows);
  console.log("CSV has been updated with output paths");
  return outputFile;
}
