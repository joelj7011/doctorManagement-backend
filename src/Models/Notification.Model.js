const { Mongoose, default: mongoose } = require("mongoose");

const indentification = new mongoose.Schema({
  type: mongoose.Types.ObjectId,
  role: {
    type: String,
    role: ["User", "Doctor"],
  },
});
const NotificationSchema = new mongoose.Schema(
  {
    reciver: {
      type: indentification,
      required: true,
    },
    message: {
      type: String,
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", NotificationSchema);
module.exports = Notification;
