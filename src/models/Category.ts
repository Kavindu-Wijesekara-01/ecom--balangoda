import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
}, { timestamps: true });

// මෙතන "Category" කියන නම අනිවාර්යයෙන්ම හරියට තියෙන්න ඕනේ
export default mongoose.models.Category || mongoose.model("Category", CategorySchema);