const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { corsOptions } = require('../Constants');
const PatientRoute = require('./Routes/Patient.Routes');
const DoctorRoute = require('./Routes/Doctor.Routes');
const ReviewRoute = require('./Routes/Review.Routes');

const app = express();

app.use(express.json({ limit: '32mb' }));
app.use(express.urlencoded({ extended: true, limit: '32mb' }));
app.use(express.static('public'));
app.use(cookieParser());
app.use(cors(corsOptions));

app.get('/api/patient', (req, res) => {
    res.send('Hello from HTTPS server!');
});

app.use('/api/patient', PatientRoute);
app.use('/api/doctor', DoctorRoute);
app.use('/api/review', ReviewRoute);

module.exports = app;
