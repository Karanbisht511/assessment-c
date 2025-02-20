import { Schema, Document, model } from "mongoose";

export interface Istatus extends Document {
  status: string;
  requestId: string;
}

const statusSchema = new Schema({
  status: { type: String, enum: ["Completed", "Pending", "Failed"] },
  requestId: { type: String, required: true },
});

export const status = model<Istatus>("Status", statusSchema);

export const setStatus = async (
  requestId: string,
  toSet: string = "Pending"
) => {
  const isExist = await status.find({ requestId });
  console.log(isExist);

  if (isExist.length === 0) {
    console.log("dont exist");

    const newStatus = new status({ status: toSet, requestId });
    newStatus.save();
    return;
  }
  console.log("exist");

  await status.findOneAndUpdate({ requestId }, { status: toSet });
};

export const getStatus = async (requestId: string) => {
  const res = await status.findOne({ requestId });

  if (!res) {
    return null;
  }
  console.log("res:", res?.status);

  return res?.status;
};
