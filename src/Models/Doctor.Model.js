const mongoose = require('mongoose');
const { hashPassword, comparePassword, generateAccessToken, generateRefreshToken } = require('../Utils/Auth.Utils');

const DoctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: Number, required: true },
    address: { type: String, required: true },
    specialization: { type: String },
    Max: { type: Number },
    patientStatus: [{
        number: { type: Number, default: 0 },
    }],
    role: { type: String, required: true },
    availability: [
        {
            day: { type: String, required: true },
            start: { type: String, required: true },
            end: { type: String, required: true },
            laterNumber: { number: { type: Number, default: 0 } },
            available: { type: Boolean, default: false }
        }
    ],
    refreshToken: { type: String },
}, { timestamps: true });

DoctorSchema.pre('save', function (next) {
    this.patientStatus.forEach((status) => {
        if (status.number < 0) {
            status.number = 0;
        }
    });
    next();
});
DoctorSchema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate();
    if (update.$set && update.$set.patientStatus) {
        update.$set.patientStatus.forEach((status) => {
            if (status.number < 0) {
                status.number = 0;
            }
        });
    }
    if (update.$inc && update.$inc['patientStatus.0.number'] < 0) {
        update.$inc['patientStatus.0.number'] = 0;
    }
    next();
});
DoctorSchema.methods.hashPassword = function (password) {
    return hashPassword.call(this, password);
};
DoctorSchema.methods.comparePassword = function (password) {
    return comparePassword.call(this, password);
};
DoctorSchema.methods.generateAccessToken = function () {
    return generateAccessToken.call(this);
};
DoctorSchema.methods.generateRefreshToken = function () {
    return generateRefreshToken.call(this);
};
const Doctor = mongoose.model('Doctor', DoctorSchema);
module.exports = Doctor;
