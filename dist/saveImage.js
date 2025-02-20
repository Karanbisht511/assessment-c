var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Schema, model } from "mongoose";
import fs from "fs";
import path from "path";
const imageSchema = new Schema({
    name: { type: String, required: true },
    image: { type: Buffer, required: true },
    contentType: { type: String, required: true },
    productName: { type: String, required: true },
    requestId: { type: String, required: true },
});
export const image = model("Images", imageSchema);
export const saveImageToDB = (imageName, requestId) => __awaiter(void 0, void 0, void 0, function* () {
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
        yield newImage.save();
    }
    catch (error) {
        console.log("error:", error);
    }
});
//# sourceMappingURL=saveImage.js.map