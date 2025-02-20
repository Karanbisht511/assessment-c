var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
// The type guard
export function isProcessingResult(result) {
    return result.success === true;
}
function createProcessingResult(params) {
    return Object.assign({ success: true }, params);
}
function createProcessingError(inputPath, error) {
    return {
        success: false,
        inputPath,
        error: error instanceof Error ? error.message : "Unknown error occurred",
    };
}
class ImageProcessor {
    constructor(options = { quality: 50 }) {
        this.quality = options.quality;
        this.defaultOutputDir = options.defaultOutputDir;
    }
    /**
     * Process a single image with compression
     * @param inputPath - Path to input image
     * @param outputPath - Optional custom output path
     */
    processImage(inputPath, outputPath) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Generate output path if not provided
                const finalOutputPath = outputPath !== null && outputPath !== void 0 ? outputPath : this.generateOutputPath(inputPath);
                // Ensure output directory exists
                yield this.ensureOutputDirectory(finalOutputPath);
                // Get original file size
                const inputStats = yield fs.stat(inputPath);
                const originalSize = inputStats.size;
                // Process the image
                yield sharp(inputPath)
                    .jpeg({ quality: this.quality, force: false })
                    .png({ quality: this.quality, force: false })
                    .webp({ quality: this.quality, force: false })
                    .toFile(finalOutputPath);
                // Get compressed file size
                const outputStats = yield fs.stat(finalOutputPath);
                const compressedSize = outputStats.size;
                // Calculate compression ratio
                const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;
                const result = createProcessingResult({
                    inputPath,
                    outputPath: finalOutputPath,
                    originalSize,
                    compressedSize,
                    compressionRatio,
                });
                // Validate the result using type guard
                if (!isProcessingResult(result)) {
                    throw new Error("Failed to create valid processing result");
                }
                return result;
            }
            catch (error) {
                return createProcessingError(inputPath, error);
            }
        });
    }
    /**
     * Process multiple images concurrently
     * @param imagePaths - Array of input image paths
     * @param outputDir - Optional output directory
     */
    processMultipleImages(imagePaths, outputDir) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const finalOutputDir = outputDir !== null && outputDir !== void 0 ? outputDir : "compressedImages";
                // Create output directory if specified
                if (finalOutputDir) {
                    yield fs.mkdir(finalOutputDir, { recursive: true });
                }
                // Process all images concurrently
                const processPromises = imagePaths.map((inputPath) => {
                    let outputPath;
                    if (finalOutputDir) {
                        const filename = path.basename(inputPath);
                        outputPath = path.join(finalOutputDir, filename);
                    }
                    return this.processImage(inputPath, outputPath);
                });
                return yield Promise.all(processPromises);
            }
            catch (error) {
                // Return error result for each image
                return imagePaths.map((inputPath) => ({
                    success: false,
                    inputPath,
                    error: error instanceof Error ? error.message : "Unknown error occurred",
                }));
            }
        });
    }
    /**
     * Generate default output path for an image
     * @param inputPath - Original image path
     */
    generateOutputPath(inputPath) {
        const parsedPath = path.parse(inputPath);
        const outputFileName = `${parsedPath.name}_compressed${parsedPath.ext}`;
        return this.defaultOutputDir
            ? path.join(this.defaultOutputDir, outputFileName)
            : path.join(parsedPath.dir, outputFileName);
    }
    /**
     * Ensure output directory exists
     * @param filePath - Path where file will be saved
     */
    ensureOutputDirectory(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const directory = path.dirname(filePath);
            yield fs.mkdir(directory, { recursive: true });
        });
    }
}
export default ImageProcessor;
//# sourceMappingURL=compressor.js.map