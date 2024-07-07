const mongoose = require('mongoose');
const { hashPassword, comparePassword, generateAccessToken, generateRefreshToken } = require('../Utils/Auth.Utils');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: Number, required: true },
    profileImage: { type: String },
    address: { type: String, required: true },
    refreshToken: { type: String },
    appointmentStatus: [{
        appointment: {
            type: Boolean,
            default: false
        },
        patient: [
            {
                patientnumber: {
                    type: Number
                },
                time: {
                    type: String
                },
                day: {
                    type: String
                },
                date: {
                    type: String
                }
            }
        ]

    }],
    history: [
        {
            doctorId: {
                type: mongoose.Types.ObjectId,
                ref: 'appointment'
            },
            date: {
                type: String,
                require: true
            }
        }
    ],

    role: { type: String, required: true },

}, { timestamps: true });

userSchema.methods.hashPassword = function (password) {
    return hashPassword.call(this, password);
};

userSchema.methods.comparePassword = function (password) {
    return comparePassword.call(this, password);
};

userSchema.methods.generateAccessToken = function () {
    return generateAccessToken.call(this);
};

userSchema.methods.generateRefreshToken = function () {
    return generateRefreshToken.call(this);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
