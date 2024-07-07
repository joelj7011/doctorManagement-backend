const mongoose = require('mongoose');

const AppointmentSchema = mongoose.Schema({
    doctor: {
        type: String,
        ref: 'User'
    },
    patient: {
        type: String,
        ref: 'User'
    },
    laterPatient: [
        {
            day: {
                type: String
            },
            data: {
                type: Date,
            },
            laterPatientNumber: {
                type: Number
            }
        }
    ]
}, { timestamps: true });


const Appontment = mongoose.model("appointment", AppointmentSchema);
module.exports = Appontment;