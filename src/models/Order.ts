import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true }, // අලුතින් එකතු කළා
  time: { type: String, required: true },    // අලුතින් එකතු කළා
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    whatsapp: { type: String, required: true },
    address: { type: String, required: true }
  },
  paymentMethod: { type: String, required: true },
  items: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
      selectedSize: { type: String },   // Clothing variation — optional
      selectedColor: { type: String }   // Clothing variation — optional
    }
  ],
  totalAmount: { type: Number, required: true },
  status: { type: String, default: "Pending" } // Pending, Processing, Completed
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);