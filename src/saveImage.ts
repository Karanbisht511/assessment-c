import { Schema, Document, model } from "mongoose";
import fs from "fs";
import path from "path";

export interface Iimage extends Document {
  name: string;
  image: Buffer;
  contentType: string;
  productName: string;
  status: string;
  requestId: string;
}

const imageSchema = new Schema({
  name: { type: String, required: true },
  image: { type: Buffer, required: true },
  contentType: { type: String, required: true },
  productName: { type: String, required: true },
  requestId: { type: String, required: true },
});

export const image = model<Iimage>("Images", imageSchema);

export const saveImageToDB = async (imageName: string, requestId: string) => {
  try {
    const filePath = path.join(process.cwd(), imageName);
    console.log("imagePath:", filePath);

    const imageBuffer = fs.readFileSync(filePath);
    const contentType = path.extname(filePath).substring(1);
    const newImage = new image({
      name: imageName.split("/")[1].slice(0, -1),
      image: imageBuffer,
      contentType: `image/${contentType}`,
      productName: imageName.split("/")[1].slice(0, -1),
      requestId,
    });
    await newImage.save();
  } catch (error) {
    console.log("error:", error);
  }
};
