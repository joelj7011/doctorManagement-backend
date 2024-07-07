const express = require('express');
var cookieParser = require('cookie-parser');
const cors = require('cors');
const { corsOptions } = require('../Constants');
const PatientRoute = require('./Routes/Patient.Routes');
const DoctorRoute = require('./Routes/Doctor.Routes');
const ReviewRoute = require('./Routes/Review.Routes');
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));


app.use('/api/patient', PatientRoute);
app.use('/api/doctor', DoctorRoute);
app.use('/api/review', ReviewRoute);

module.exports = app;
