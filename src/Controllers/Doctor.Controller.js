const moment = require('moment');
const { options, filterdzzetail, convertToISOTime, filterdetail } = require("../../Constants");
const Appontment = require("../Models/Appointment.Models");
const Doctor = require("../Models/Doctor.Model");
const User = require("../Models/User.Model");
const ApiError = require("../Utils/Apierror.Utils");
const ApiResponse = require("../Utils/Apiresponse.utils");
const catchAsyncErrors = require("../Utils/CatchAsyncError.util");
const { GenerateTokens } = require("../Utils/SendToken.utils");
const { agenda } = require('../ScheduleTasks/agend.ScheduleTasks');
const { default: mongoose } = require('mongoose');
const { asyncHandler } = require('../Utils/AsyncHandler.Utiles');


exports.createDoctor = asyncHandler(async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;
        if (name && email && password && phone && address) {
            console.log("test1-passed");
        } else {
            console.log("test1-failed");
            throw new ApiError(400, "all fields are required");
        }
        const doctor = await Doctor.create({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            phone: req.body.phone,
            address: req.body.address,
            role: req.body.role,
            profileImage: req.file.path
        });
        if (doctor) {
            console.log("test2-passed");
        } else {
            console.log("test2-failed");
            throw new ApiError(401, "doctor could not be created");
        }
        const headPassword = await doctor.hashPassword(doctor.password);
        if (headPassword) {
            console.log("test3-passed");
            return res.json(new ApiResponse(200, doctor, " doctor created successfully"));
        } else {
            console.log("test3-failed");
            return res.status(400).json({ error: "could not hash the password" });
        }
    } catch (error) {
        catchAsyncErrors(error, req, res);
    }
});
exports.loginDoctor = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (email && password) {
        console.log("test1-passed");
    } else {
        console.log("test1-failed");
        throw new ApiError(400, "all fields are required");
    }

    const doctor = await Doctor.findOne({ email: email });
    if (doctor) {
        console.log("test2-passed");
    } else {
        console.log("test2-failed");
        throw new ApiError(400, "email not found");
    }

    const passwordCompare = await doctor?.comparePassword(password);
    if (passwordCompare) {
        console.log("test3-passed");
    } else {
        console.log("test3-failed");
        return res.status(401).json({ message: 'please login with correct credentials' });
    }

    const { accessToken, refreshToken } = await GenerateTokens(null, doctor.id);
    if (accessToken && refreshToken) {
        console.log("test4-passed");
    } else {
        console.log("test4-failed");
    }

    return res.status(200).cookie('accessToken', accessToken, options).cookie('refreshToken', refreshToken, options).json(new ApiResponse(200, { data: doctor, accessToken, refreshToken }, "user logged in"));


});
exports.getDoctorData = asyncHandler(async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.doctor.id);
        if (doctor) {
            console.log("test-1-passed");
        } else {
            console.log("test2-failed");
            throw new ApiError(400, "data was not found");
        }
        const filterdetails = filterdetail(doctor);
        if (filterdetails) {
            console.log("test1->passed");
            return res.status(200).json(new ApiResponse(200, filterdetails, "docotr fetched successfully"));
        } else {
            console.log("test2->failed");
            throw new ApiError(500, "could not fetch the docotr");
        }

    } catch (error) {
        catchAsyncErrors(error, req, res);
    }
});
exports.setCriteria = asyncHandler(async (req, res) => {
    try {

        const { HowManyPatients, day, start, end } = req.body;
        if (HowManyPatients && day && start && end) {
            console.log("test1-passed");
        } else {
            console.log("test1-failed");
            throw new ApiError(401, "all fileds are required");
        }
        let scheduledTime = moment().day(day).hour(moment(end, 'hh:mm a').hour()).minute(moment(end, 'hh:mm a').minute()).second(0).toString();
        if (scheduledTime) {
            console.log("test3->passed");
        } else {
            console.log("test5->failed");
            return res.status(400).json({ error: "could not create timing" });

        }

        const startTimeISO = convertToISOTime(start);
        if (startTimeISO) {
            console.log("test2-passed");
        } else {
            console.log("test2-failed");
            throw new ApiError(401, " conversion to ISOS failed");
        }

        const endTimeISO = convertToISOTime(end);
        if (endTimeISO) {
            console.log('test3-passed');
        } else {
            console.log("test3-failed");
            throw new ApiError(401, " conversion to ISOS failed");
        }

        const find_doctor = await Doctor.findById(req.doctor?.id);
        if (find_doctor) {
            console.log("test4->passed");
        } else {
            console.log("test4->failed");
            throw new ApiError(403, "could not find the doctor");
        }

        const array = find_doctor?.availability?.find((status) => {
            return status.day === day;
        });
        if (array || array?.length > 0) {
            console.log("test5->failed");
            throw new ApiError(400, "day with same timing already exists ");
        } else {
            console.log("test5->passed");
        }

        const update_doctor_availability = await Doctor.findByIdAndUpdate(
            find_doctor?.id,
            {
                $push: {
                    availability: {
                        day: day,
                        start: startTimeISO,
                        end: endTimeISO,
                        available: true
                    }
                },
                $set: { Max: HowManyPatients }
            },
            { new: true });
        if (update_doctor_availability) {
            console.log("test6->passed");
        } else {
            console.log("test6->failed");
            throw new ApiError(400, "details could not be updated");
        }

        const job = await agenda.schedule(scheduledTime, 'remove expired availability', { doctorId: find_doctor._id });
        if (!job) {
            console.log("test7->failed");
            throw new ApiError(400, "Error occurred with the job");
        } else {
            console.log("test7->passed");
            console.log(`Scheduled job with ID ${job.attrs._id} for doctor ${find_doctor._id} at ${endTimeISO}`);
            return res.json(new ApiResponse(200, find_doctor, "criteria has been set"));
        }

    } catch (error) {
        catchAsyncErrors(error, req, res);
    }
});
exports.getDetailOfthePatient = asyncHandler(async (req, res) => {
    try {
        const pipeline = await Doctor.aggregate(
            [
                {
                    $match: {
                        _id: new mongoose.Types.ObjectId(req.doctor.id)
                    }
                },
                {
                    $addFields: {
                        _idStr: { $toString: "$_id" }
                    }
                },
                {
                    $lookup: {
                        from: "appointments",
                        localField: "_idStr",
                        foreignField: "doctor",
                        as: "result"
                    }
                },
                {
                    $unwind: {
                        path: "$result",
                    }
                },
                {
                    $group: {
                        _id: "$_id",
                        totalAppointments: { $sum: 1 },
                        appointments: { $push: "$result" }
                    }
                },
                {
                    $project: {
                        appointments: 1
                    }
                }
            ]
        );
        if (pipeline.length === 0) {
            throw new ApiError(403, "could not find any ")
        }



        return res.json(new ApiResponse(200, { data: pipeline }, "hello"))


    } catch (error) {
        catchAsyncErrors(error, req, res);
    }
});
exports.manualUpdate = asyncHandler(async (req, res) => {
    Doctor.findById(req.doctor?.id)
        .then((doctor) => {
            console.log(doctor);
            if (!doctor) {
                throw new ApiError(401, "Doctor not found");
            }
            return Doctor.findByIdAndUpdate(req.doctor?.id, {
                $unset: { 'patientStatus.0.number': -1 }
            }, { new: true });
        })
        .then((updatedDoctor) => {
            console.log(updatedDoctor);
            return User.findByIdAndUpdate(req.params?.id, {
                $unset: {
                    'appointmentStatus.$[elem].appointment': false,
                    'appointmentStatus.$[elem].patient': '',
                    'appointmentStatus.$[elem].time': '',
                    'appointmentStatus.$[elem].day': '',
                    'appointmentStatus.$[elem].data': null,
                }
            }, {
                arrayFilters: [{ 'elem.appointment': true }]
            }).then((updatedUser) => {
                return { updatedDoctor, updatedUser };
            });
        })
        .then((result) => {
            console.log(result);
            res.status(200).json(new ApiResponse(200, result, "Manually updated"));
        })
        .catch((err) => {
            catchAsyncErrors(err, req, res);
        });
});
