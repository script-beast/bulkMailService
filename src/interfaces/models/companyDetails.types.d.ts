import mongoose from "mongoose";

export type companyDetailsType = {
  companyName: string;
  email: string;
  name: string;
  designation: string;
};

type adminType = {
  companyName: string;
  email: string;
  name: string;
  designation: string;
  isSent: boolean;
  sendDate: Date;
} & mongoose.Document;

export default adminType;
