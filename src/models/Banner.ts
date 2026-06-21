import mongoose from "mongoose";

const BannerSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
}, { timestamps: true });

export default mongoose.models.Banner || mongoose.model("Banner", BannerSchema);