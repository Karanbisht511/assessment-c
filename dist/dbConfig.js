import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();
const uri = process.env.MONGO_URI;
export function connectMongo() {
    try {
        if (!uri)
            throw new Error("mongo uri is not defined in the .env file");
        mongoose.connect(uri);
        console.log("Mongodb connected");
    }
    catch (error) {
        console.log(error.message);
    }
}
//# sourceMappingURL=dbConfig.js.map