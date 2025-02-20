import sharp from "sharp";
import path from "path";
import fs from "fs/promises";

// Interfaces for type safety
export interface ProcessingResult {
  success: true;
  inputPath: string;
  outputPath: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

export interface ProcessingError {
  success: false;
  inputPath: string;
  error: string;
}

export type ProcessingOutput = ProcessingError | ProcessingResult;

// The type guard
export function isProcessingResult(
  result: ProcessingOutput
): result is ProcessingResult {
  return result.success === true;
}

function createProcessingResult(
  params: Omit<ProcessingResult, "success">
): ProcessingResult {
  return {
    success: true,
    ...params,
  };
}

function createProcessingError(
  inputPath: string,
  error: unknown
): ProcessingError {
  return {
    success: false,
    inputPath,
    error: error instanceof Error ? error.message : "Unknown error occurred",
  };
}

interface ImageProcessorOptions {
  quality: number;
  defaultOutputDir?: string;
}

class ImageProcessor {
  private readonly quality: number;
  private readonly defaultOutputDir?: string;

  constructor(options: ImageProcessorOptions = { quality: 50 }) {
    this.quality = options.quality;
    this.defaultOutputDir = options.defaultOutputDir;
  }

  /**
   * Process a single image with compression
   * @param inputPath - Path to input image
   * @param outputPath - Optional custom output path
   */
  async processImage(
    inputPath: string,
    outputPath?: string
  ): Promise<ProcessingOutput> {
    try {
      // Generate output path if not provided
      const finalOutputPath = outputPath ?? this.generateOutputPath(inputPath);

      // Ensure output directory exists
      await this.ensureOutputDirectory(finalOutputPath);

      // Get original file size
      const inputStats = await fs.stat(inputPath);
      const originalSize = inputStats.size;

      // Process the image
      await sharp(inputPath)
        .jpeg({ quality: this.quality, force: false })
        .png({ quality: this.quality, force: false })
        .webp({ quality: this.quality, force: false })
        .toFile(finalOutputPath);

      // Get compressed file size
      const outputStats = await fs.stat(finalOutputPath);
      const compressedSize = outputStats.size;

      // Calculate compression ratio
      const compressionRatio =
        ((originalSize - compressedSize) / originalSize) * 100;

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
    } catch (error) {
      return createProcessingError(inputPath, error);
    }
  }

  /**
   * Process multiple images concurrently
   * @param imagePaths - Array of input image paths
   * @param outputDir - Optional output directory
   */
  async processMultipleImages(
    imagePaths: string[],
    outputDir?: string
  ): Promise<ProcessingOutput[]> {
    try {
      const finalOutputDir = outputDir ?? "compressedImages";

      // Create output directory if specified
      if (finalOutputDir) {
        await fs.mkdir(finalOutputDir, { recursive: true });
      }

      // Process all images concurrently
      const processPromises = imagePaths.map((inputPath) => {
        let outputPath: string | undefined;
        if (finalOutputDir) {
          const filename = path.basename(inputPath);
          outputPath = path.join(finalOutputDir, filename);
        }
        return this.processImage(inputPath, outputPath);
      });

      return await Promise.all(processPromises);
    } catch (error) {
      // Return error result for each image
      return imagePaths.map((inputPath) => ({
        success: false as const,
        inputPath,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      }));
    }
  }

  /**
   * Generate default output path for an image
   * @param inputPath - Original image path
   */
  private generateOutputPath(inputPath: string): string {
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
  private async ensureOutputDirectory(filePath: string): Promise<void> {
    const directory = path.dirname(filePath);
    await fs.mkdir(directory, { recursive: true });
  }
}

export default ImageProcessor;
