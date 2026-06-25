import mongoose from "mongoose";

// Product එකට කලින් අනිවාර්යයෙන්ම Category එක රෙජිස්ටර් වෙන්න මේ ලයින් එක දානවා
import "./Category"; 

const ReviewSchema = new mongoose.Schema({
  username: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true }
}, { timestamps: true });

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  
  // මෙතන ref: 'Category' කියන්නේ අර කලින් හදපු නමමයි
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  reviews: [ReviewSchema],
  inStock: { type: Boolean, default: true },
  // Clothing variation fields — optional, only populated for apparel products
  sizes: [{ type: String }],
  colors: [{
    name: { type: String },
    image: { type: String }
  }]
}, { timestamps: true });

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);