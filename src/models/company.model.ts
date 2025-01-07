import mongoose from "mongoose";
import companyDetailsType from "../interfaces/models/companyDetails.types";

const companySchema = new mongoose.Schema<companyDetailsType>(
  {
    companyName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    designation: { type: String, required: true },
    isSent: { type: Boolean, default: false },
    sendDate: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model<companyDetailsType>("company", companySchema);
