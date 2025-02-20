var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { parse } from "csv-parse";
import * as fs from "fs/promises";
import * as path from "path";
class FileValidation {
    constructor(filePath) {
        this.fileContent = [];
        this.expectedColumns = [
            "S. No.",
            "Product Name",
            "Input Image Urls",
        ];
        this.filePath = filePath;
    }
    parseCSV(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fileContent = yield fs.readFile(filePath, "utf-8");
                return new Promise((resolve, reject) => {
                    parse(fileContent, {
                        columns: true,
                        skip_empty_lines: true,
                        trim: true,
                    }, (err, data) => {
                        if (err)
                            reject(err);
                        resolve(data);
                    });
                });
            }
            catch (error) {
                let msg;
                if (error instanceof Error)
                    msg = `Error reading or parsing CSV file: ${error.message}`;
                throw new Error(msg);
            }
        });
    }
    validate() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = {
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
                this.fileContent = yield this.parseCSV(this.filePath);
                //   console.log("this.fileContent:", this.fileContent);
                // Validate headers
                if (!(yield this.checkHeaders())) {
                    result.errors.push(`Invalid headers. Expected: ${this.expectedColumns.join(", ")}`);
                    result.isValid = false;
                }
                // Validate data
                const productNameValid = yield this.validateProductsNameColumn();
                const imgLinksValid = yield this.validateImgLinksColumn();
                const urlsValid = yield this.areValidURls();
                if (!productNameValid) {
                    result.errors.push("Product Name column contains invalid or empty values");
                    result.isValid = false;
                }
                if (!imgLinksValid) {
                    result.errors.push("Input Image Urls column contains invalid or empty values");
                    result.isValid = false;
                }
                if (!urlsValid) {
                    result.errors.push("One or more URLs are invalid");
                    result.isValid = false;
                }
                return result;
            }
            catch (error) {
                result.isValid = false;
                let msg;
                if (error instanceof Error) {
                    msg = `Validation failed: ${error.message}`;
                }
                result.errors.push(msg);
                return result;
                //   result.isValid = false;
                //   result.errors.push(`Validation failed: ${error.message}`);
                //   return result;
            }
        });
    }
    fileFormat() {
        return path.extname(this.filePath).toLowerCase() === ".csv";
    }
    checkHeaders() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.fileContent.length === 0)
                return false;
            const headers = Object.keys(this.fileContent[0]);
            return this.expectedColumns.every((col, index) => headers[index] === col);
        });
    }
    validateProductsNameColumn() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.fileContent.every((row) => row["Product Name"] &&
                typeof row["Product Name"] === "string" &&
                row["Product Name"].trim().length > 0);
        });
    }
    validateImgLinksColumn() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.fileContent.every((row) => row["Input Image Urls"] &&
                typeof row["Input Image Urls"] === "string" &&
                row["Input Image Urls"].trim().length > 0);
        });
    }
    areValidURls() {
        return __awaiter(this, void 0, void 0, function* () {
            const urlPattern = /^(https?:\/\/[^\s]+)$/;
            return this.fileContent.every((row) => {
                const urls = row["Input Image Urls"].split(",").map((url) => url.trim());
                return urls.every((url) => urlPattern.test(url));
            });
        });
    }
    // Getter method to access the parsed content
    getFileContent() {
        return this.fileContent;
    }
}
export { FileValidation };
//# sourceMappingURL=fileValidation.js.map