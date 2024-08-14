const { default: mongoose } = require("mongoose");

const MessageSchema = new mongoose.Schema({
    from: {
        type: mongoose.Types.ObjectId,
    },
    to: {
        type: mongoose.Types.ObjectId
    },
    role: {
        enum: ['receiver', 'sender'],
        required: true
    },
    message: {
        type: String,
        required: true
    }
}, { timestamps: true });

const Messages = mongoose.model('Messages', MessageSchema);
module.exports = Messages;