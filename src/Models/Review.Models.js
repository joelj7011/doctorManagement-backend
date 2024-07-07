const { default: mongoose, Schema } = require("mongoose");

const ReviewSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    patient: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    doctor: {
        type: Schema.Types.ObjectId,
        ref: 'Doctor'
    }
}, { timestamps: true });

const Review = mongoose.model('Review', ReviewSchema);
module.exports = Review;