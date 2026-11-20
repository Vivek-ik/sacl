import mongoose from "mongoose";

const contactInquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 120,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 15,
      default: "",
    },

    subject: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "General Enquiry",
    },

    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 3000,
    },

    status: {
      type: String,
      enum: ["new", "in_progress", "resolved"],
      default: "new",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("ContactInquiry", contactInquirySchema);
