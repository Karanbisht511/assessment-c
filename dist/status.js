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
const statusSchema = new Schema({
    status: { type: String, enum: ["Completed", "Pending", "Failed"] },
    requestId: { type: String, required: true },
});
export const status = model("Status", statusSchema);
export const setStatus = (requestId_1, ...args_1) => __awaiter(void 0, [requestId_1, ...args_1], void 0, function* (requestId, toSet = "Pending") {
    const isExist = yield status.find({ requestId });
    console.log(isExist);
    if (isExist.length === 0) {
        console.log("dont exist");
        const newStatus = new status({ status: toSet, requestId });
        newStatus.save();
        return;
    }
    console.log("exist");
    yield status.findOneAndUpdate({ requestId }, { status: toSet });
});
export const getStatus = (requestId) => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield status.findOne({ requestId });
    if (!res) {
        return null;
    }
    console.log("res:", res === null || res === void 0 ? void 0 : res.status);
    return res === null || res === void 0 ? void 0 : res.status;
});
//# sourceMappingURL=status.js.map