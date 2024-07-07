const { validationResult } = require('express-validator');
const ApiResponse = require('../Utils/Apiresponse.utils');
const { findUser } = require('../DataStructure/User.Algo');
const catchAsyncErrors = require('../Utils/CatchAsyncError.util');
const { filterdetail, options, convertToISOTime } = require('../../Constants');
const Appontment = require('../Models/Appointment.Models');
const User = require('../Models/User.Model');
const { GenerateTokens } = require('../Utils/SendToken.utils');
const Doctor = require('../Models/Doctor.Model');
const ApiError = require('../Utils/Apierror.Utils');
const { asyncHandler } = require('../Utils/AsyncHandler.Utiles');
const { agenda_doctor } = require('../ScheduleTasks/agend.ScheduleTasks');


exports.createUser = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const user = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            phone: req.body.phone,
            address: req.body.address,
            role: req.body.role
        });

        const hashPassword = user?.hashPassword(user.password);
        if (hashPassword) {
            return res.json(new ApiResponse(200, user, "user created"));
        }

    } catch (error) {
        catchAsyncErrors(error, req, res);
    }
};
exports.login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors) {
            return res.status(400).send(errors);
        }
        const { email, password } = req.body;
        if (email && password) {
            console.log("test1-passed");
        } else {
            console.log("test1-failed");
        }

        const user = await findUser(email, null, null);
        console.log(user)
        if (user) {
            console.log("test1-passed");
        } else {
            console.log("test2-failed");
            return res.status(400).json({ error: "no data found" });
        }


        const passwordCompare = await user?.comparePassword(password);
        if (passwordCompare) {
            console.log("test3-passed");
        } else {
            console.log("test3-failed");
            return res.status(401).json({ message: 'please login with correct credentials' });

        }

        const { accessToken, refreshToken } = await GenerateTokens(user.id);
        console.log(accessToken);
        if (accessToken && refreshToken) {
            console.log("test4-passed");
        } else {
            console.log("test4-failed");
        }

        return res.status(200).cookie('accessToken', accessToken, options).cookie('refreshToken', refreshToken, options).json(new ApiResponse(200, { data: user, accessToken, refreshToken }, "user logged in"));

    } catch (error) {
        console.log(error);
    }
};
exports.getuserData = async (req, res) => {
    try {
        console.log(req.user);
        const user = await findUser(null, null, req.user.id);
        if (user) {
            console.log("test-1-passed");
        } else {
            console.log("test2-failed");
            return res.status(400).json({ error: "user data was not recived" });
        }

        const filterdetails = filterdetail(user);
        if (filterdetails) {
            console.log("test1->passed");
            return res.status(200).json(new ApiResponse(200, filterdetails, "user fetched successfully"));
        } else {
            console.log("test2->failed");
            return res.status(500).json({ error: "could not fetch the user" });
        }

    } catch (error) {
        catchAsyncErrors(error, req, res);
    }
};
exports.fetchAllDoctors = async (req, res) => {
    try {
        let role = "doctor";
        const doctors = await findUser(null, role, null);
        if (doctors) {
            console.log("test1-passed");
        } else {
            console.log("test1-failed")
            return res.status(400).json({ error: "date was not transfered" });
        }

        const filteredDoctors = await filterdetail(doctors);
        if (filteredDoctors) {
            console.log("test 2->passed");
        } else {
            console.log("test 2->failed");
            return res.status(500).json({ error: "Could not fetch doctors" });
        }

        const doctorsArray = Object.entries(filteredDoctors);
        const getLocation = doctorsArray
            .map(([keys, doctor]) => {
                return doctor.address === req.user.address ? null : doctor;
            })
            .filter(Boolean);

        if (getLocation) {
            console.log("test3->passed");
            return res.json(new ApiResponse(200, getLocation, " doctors near you"));
        } else {
            console.log("test3->failed");
            return res.status(400).json({ error: "no data recived from the filterdetails" });
        }

    } catch (error) {
        catchAsyncErrors(error, req, res);
    }
};
exports.BookAppointment = async (req, res) => {
    try {
        const patient = await findUser(null, null, req.user.id);
        if (patient) {
            console.log("test1-passed");
        } else {
            console.log("test1-failed");
            return res.status(400).json({ error: "no user found" });
        }

        const appointmentExists = patient.appointmentStatus.find(status => status.appointment);
        if (appointmentExists) {
            console.log("test2-filed");
            throw new ApiError(400, "You already have an appointment booked")
        } else {
            console.log("test2-passed")
        }

        const doctor = await Doctor.findById(req.params.id);
        if (doctor) {
            console.log("test3-passed");
        } else {
            console.log("test3-failed");
            throw new ApiError(400, "no doctor found");
        }

        const appointment = await Appontment.create({
            doctor: doctor._id,
            patient: patient._id
        });
        if (appointment) {
            console.log("test4->passed");
        } else {
            console.log("test4->failed");
            throw new ApiError(400, "appointment could not be made");
        }

        const now = new Date();
        const time = now.toISOString().slice(0, -14).trim(" ");
        console.log(time)
        const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const currentDay = now.toLocaleDateString([], { weekday: 'long' });

        return Doctor.findByIdAndUpdate(
            doctor?.id,
            { $inc: { 'patientStatus.0.number': 1 } },
            { new: true }
        ).then((updatedDoctor) => {

            const filternumber = updatedDoctor.patientStatus.map((status) => {
                return status?.number;
            })[0];

            if (!updatedDoctor) {
                throw new ApiError(400, "Failed to update doctor's number of patients");
            }

            if (patient.appointmentStatus.length === 0) {
                return User.findByIdAndUpdate(
                    patient._id,
                    {
                        $push: {
                            appointmentStatus: {
                                appointment: true,
                                patient: {
                                    patientnumber: filternumber,
                                    time: currentTime,
                                    day: currentDay,
                                    date: time
                                }
                            },
                            history: {
                                doctorId: updatedDoctor?._id,
                                date: time
                            }
                        }
                    },
                    { new: true }
                );
            } else {
                return User.findByIdAndUpdate(
                    patient._id,
                    {
                        $set: {
                            'appointmentStatus.$[elem].appointment': true,
                            'appointmentStatus.$[elem].patient.patientnumber': filternumber,
                            'appointmentStatus.$[elem].patient.time': currentTime,
                            'appointmentStatus.$[elem].patient.day': currentDay,
                            'appointmentStatus.$[elem].patient.date': time,

                        },
                        $push: {
                            history: {
                                doctorId: updatedDoctor?._id,
                                date: time
                            }
                        }
                    },
                    {
                        arrayFilters: [
                            { 'elem.appointment': false }
                        ],
                        new: true
                    }
                );
            }
        }).then(async (patient) => {
            const filterd = filterdetail(patient);
            return res.json(new ApiResponse(200, filterd, "appointment was made"));

        });

    } catch (error) {
        catchAsyncErrors(error, req, res);
    }
};
exports.CancleAppointment = async (req, res) => {
    const patient = await findUser(null, null, req.user.id)
    if (patient) {
        console.log("test1-passed");
    } else {
        console.log("test1-failed");
        throw new ApiError(400, "No user found");
    }

    const appointmentStatus = patient.appointmentStatus.find(status => status.appointment);
    console.log(appointmentStatus)
    if (appointmentStatus) {
        console.log("test2-passed");
    } else {
        console.log("test2-failed");
        return res.json({ error: "You don’t have an appointment" });
    }


    const doctor = await Doctor.findById(req.params.id);
    if (doctor) {
        console.log("test3-passed");
    } else {
        console.log("test3-failed");
        return res.status(400).json({ error: "No doctor found" });
    }

    const decriment = doctor.patientStatus[0].number = Math.max(doctor.patientStatus[0].number - 1)
    if (decriment) {
        console.log("test4->passed");
    } else {
        console.log("test4->failed");
        throw new ApiError(401, "could not decriment");
    }

    doctor.save()
        .then(updatedDoctor => {
            if (!updatedDoctor) {
                throw new ApiError(400, "Failed to update doctor's number of patients");
            }

            return User.findByIdAndUpdate(
                patient._id,
                {
                    $set: { 'appointmentStatus.$[elem].appointment': false },
                    $unset: { 'appointmentStatus.$[elem].patient': "" }
                },
                { arrayFilters: [{ 'elem.appointment': true }], new: true }
            )
                .then(() => {
                    return Appontment.findOne({ patient: patient._id })
                        .then(cancelAppointment => {
                            if (cancelAppointment) {
                                return Appontment.findByIdAndDelete(cancelAppointment.id)
                                    .then(() => {
                                        console.log("test4-passed");
                                        return res.json(new ApiResponse(200, updatedDoctor, "Appointment deleted"));
                                    });
                            } else {
                                console.log("test4-failed");
                                throw new ApiError(400, "Could not find the appointment");
                            }
                        });
                });
        });

};
exports.History = asyncHandler(async (req, res) => {
    const patient = await User.findById(req.user?.id);
    if (patient) {
        console.log("test1->passed");
    } else {
        console.log("test1->failed");
        throw new ApiError(404, "patient not found");
    }

    const toarray = Object.entries(patient)
    if (Array.isArray(toarray)) {
        console.log("test2->passed")
    } else {
        console.log("test2->failed");
        throw new ApiError(400, "could not convert it to an array");
    }

    const history = toarray[2][1]?.history.map((status) => {
        return status?.doctorId.toString();
    }).filter(Boolean);
    if (history) {
        console.log("test3->passed");
    } else {
        console.log("test3->failed");
        throw new ApiError(404, "history not found");
    }

    let doctorHistories = [];
    if (history && history.length > 0) {
        for (let i = 0; i <= history.length; i++) {
            try {
                const doctorHistory = await Doctor.find({ _id: history[i] });
                doctorHistories.push(...doctorHistory);
            } catch (error) {
                throw new ApiError(404, `logic failed:${error}`);
            }
        }
    }
    
    const filterd = await filterdetail(doctorHistories);
    if (filterd.length > 0) {
        console.log("test4->passed");
        return res.status(200).json(new ApiResponse(200, filterd, "data fetched "));
    } else {
        console.log("test4->failed");
        throw new ApiError(403, "could not populate the array");
    }

});
