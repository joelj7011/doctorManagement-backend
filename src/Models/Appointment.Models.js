const mongoose = require('mongoose');

const AppointmentSchema = mongoose.Schema({
    doctor: {
        type: String,
        ref: 'User',
        required: true
    },
    patient: {
        type: String,
        ref: 'User',
        required: true
    },
    laterPatient: [
        {
            day: {
                type: String,
                required: true
            },
            date: {
                type: String,
                required: true
            },
           
        }
    ]
}, { timestamps: true });


const Appontment = mongoose.model("appointment", AppointmentSchema);
module.exports = Appontment;