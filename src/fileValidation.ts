import { parse } from "csv-parse";
import * as fs from "fs/promises";
import * as path from "path";

interface CSVRow {
  "S. No.": string;
  "Product Name": string;
  "Input Image Urls": string;
  [key: string]: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

class FileValidation {
  private filePath: string;
  private fileContent: CSVRow[] = [];
  private readonly expectedColumns: string[] = [
    "S. No.",
    "Product Name",
    "Input Image Urls",
  ];

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  public async parseCSV(filePath: string): Promise<CSVRow[]> {
    try {
      const fileContent = await fs.readFile(filePath, "utf-8");
      return new Promise((resolve, reject) => {
        parse(
          fileContent,
          {
            columns: true,
            skip_empty_lines: true,
            trim: true,
          },
          (err, data) => {
            if (err) reject(err);
            resolve(data);
          }
        );
      });
    } catch (error) {
      let msg;
      if (error instanceof Error)
        msg = `Error reading or parsing CSV file: ${error.message}`;

      throw new Error(msg);
    }
  }

  public async validate(): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
    };

    try {
      // Check file format
      if (!this.fileFormat()) {
        result.errors.push("Invalid file format. Only CSV files are allowed.");
        result.isValid = false;
        return result;
      }

      // Parse and store file content
      this.fileContent = await this.parseCSV(this.filePath);
    //   console.log("this.fileContent:", this.fileContent);

      // Validate headers
      if (!(await this.checkHeaders())) {
        result.errors.push(
          `Invalid headers. Expected: ${this.expectedColumns.join(", ")}`
        );
        result.isValid = false;
      }

      // Validate data
      const productNameValid = await this.validateProductsNameColumn();
      const imgLinksValid = await this.validateImgLinksColumn();
      const urlsValid = await this.areValidURls();

      if (!productNameValid) {
        result.errors.push(
          "Product Name column contains invalid or empty values"
        );
        result.isValid = false;
      }

      if (!imgLinksValid) {
        result.errors.push(
          "Input Image Urls column contains invalid or empty values"
        );
        result.isValid = false;
      }

      if (!urlsValid) {
        result.errors.push("One or more URLs are invalid");
        result.isValid = false;
      }

      return result;
    } catch (error) {
      result.isValid = false;
      let msg;
      if (error instanceof Error) {
        msg = `Validation failed: ${error.message}`;
      }
      result.errors.push(msg!);

      return result;

      //   result.isValid = false;
      //   result.errors.push(`Validation failed: ${error.message}`);
      //   return result;
    }
  }

  private fileFormat(): boolean {
    return path.extname(this.filePath).toLowerCase() === ".csv";
  }

  private async checkHeaders(): Promise<boolean> {
    if (this.fileContent.length === 0) return false;

    const headers = Object.keys(this.fileContent[0]);
    return this.expectedColumns.every((col, index) => headers[index] === col);
  }

  private async validateProductsNameColumn(): Promise<boolean> {
    return this.fileContent.every(
      (row) =>
        row["Product Name"] &&
        typeof row["Product Name"] === "string" &&
        row["Product Name"].trim().length > 0
    );
  }

  private async validateImgLinksColumn(): Promise<boolean> {
    return this.fileContent.every(
      (row) =>
        row["Input Image Urls"] &&
        typeof row["Input Image Urls"] === "string" &&
        row["Input Image Urls"].trim().length > 0
    );
  }

  private async areValidURls(): Promise<boolean> {
    const urlPattern = /^(https?:\/\/[^\s]+)$/;
    return this.fileContent.every((row) => {
      const urls = row["Input Image Urls"].split(",").map((url) => url.trim());
      return urls.every((url) => urlPattern.test(url));
    });
  }

  // Getter method to access the parsed content
  public getFileContent(): CSVRow[] {
    return this.fileContent;
  }
}

export { FileValidation, ValidationResult, CSVRow };
