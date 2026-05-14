import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  done: { type: Boolean, default: false },
  image: String,
  event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

export default mongoose.model("Task", taskSchema);
