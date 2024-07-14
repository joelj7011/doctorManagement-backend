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
const { default: mongoose } = require('mongoose');
const Notification = require('../Models/Notification.Model');
const moment = require('moment');
exports.createUser = asyncHandler(async (req, res) => {
    try {
        console.log(req.file?.path);
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
});
exports.login = asyncHandler(async (req, res) => {

    const errors = validationResult(req);
    if (!errors) {
        return res.status(400).send(errors);
    }
    const { email, password } = req.body;
    console.log(password);
    if (email && password) {
        console.log("test1-passed");
    } else {
        console.log("test1-failed");
        throw new ApiError(400, "all fields are required");
    }
    const day = "saturday";
    const time = "05:OO PM"


    const user = await findUser(email, null, null);
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
});
exports.getuserData = asyncHandler(async (req, res) => {
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
});
exports.fetchAllDoctors = asyncHandler(async (req, res) => {
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
});
exports.BookAppointment = asyncHandler(async (req, res) => {

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


});
exports.BookAppointmentManually = asyncHandler(async (req, res) => {

    const { day, time } = req?.body;
    console.log(day, time)
    if (day && time && day.trim(" ") && time.trim(" ")) {
        console.log("test1->passed");
    } else {
        console.log("test1->failed");
        return res.status(400).json({ error: "all filds are required" });
    }

    let scheduledTime = moment().day(day).hour(moment(time, 'hh:mm a').hour()).minute(moment(time, 'hh:mm a').minute()).second(0);
    const time_String = scheduledTime.toString();
    const now = new moment();

    const Isos_time = convertToISOTime(time)
    if (convertToISOTime) {
        console.log("test2->passed");
    } else {
        console.log("test2->failed");
        return res.status(400).json({ error: "could not convert the time" });
    }

    const find_patient = await User.findById(req.user?.id);
    if (find_patient) {
        console.log("test3->passed");
    } else {
        console.log("test3->failed");
        return res.status(403).json({ error: "could not find the doctro" });

    }

    const find_doctor = await Doctor.findById(req.params?.id);
    if (find_doctor) {
        console.log("test4->passed");
    } else {
        console.log("test4->failed");
        return res.status(403).json({ error: "could not find the doctor" });
    }

    const existing_Appointment = find_patient.appointmentStatus.find((status) => {
        return status.appointment;
    });
    if (existing_Appointment) {
        console.log("test3->passed");
    } else {
        console.log("test3->failed");
        return res.status(100).json({ error: "you already have an appointment" });
    }

    const exis_Appoint_with_same_date_time = await Appontment.find({
        doctor: find_doctor?.id,
        patient: find_patient?.id,
        laterPatient: {
            $elemMatch: {
                day: day,
                time: Isos_time
            }
        }
    });
    if (exis_Appoint_with_same_date_time.length > 0) {
        console.log("test6->failed");
        return res.status(400).json({ error: `appointment on  ${day} is allready booked` });
    } else {
        console.log("test6->passed");
    }

    const create_appointment = await Appontment.create({
        doctor: find_doctor?.id,
        patient: find_patient?.id,
        laterPatient: [{
            day: day,
            time: Isos_time
        }]
    });
    if (create_appointment) {
        console.log("test7->passed");
    } else {
        console.log("test7->failed");
        return res.status(100).json({ error: "could not create appointment" });
    }

    const update_doctor_availability_laterpatient = await Doctor.findByIdAndUpdate(
        find_doctor._id,
        {
            $inc: {
                [`availability.${day}.laterNumber.number`]: 1
            }
        },
        { new: true }
    );
    if (update_doctor_availability_laterpatient) {
        console.log("test8->passed");
    } else {
        console.log("test8->failed");
        return res.status(500).json({ error: "could not incriment+" })
    }

    const extract_later_patient_number = find_doctor.map((status) => {
        return status[day].laterNumber.number;
    }).filter(Boolean);
    if (extract_later_patient_number) {
        console.log("test9->passed");
    } else {
        console.log("test9->failed");
        return res.status(400), json({ errro: "failed to extract the patient number" })
    }

    const update_Patient_status = await User.findByIdAndUpdate(
        find_patient?._id,
        {
            $push: {
                appointmentStatus: {
                    appointment: true,
                    patient: {
                        patientnumber: extract_later_patient_number,
                        time: Isos_time,
                        day: day
                    }
                },
                history: find_doctor?._id,
                date: now
            }
        }
    );
    if (update_Patient_status) {
        console.log("test10->passed");
    } else {
        console.log("test1->failed");
        return res.status(400).json({ errro: "could not  update the patient status" });
    }

    const send_Notifi_to_doc = await Notification.create({
        reciver: { type: find_doctor?._id, role: find_doctor?.role },
        message: `you have a patient dr:${find_doctor?.name}`
    });
    if (send_Notifi_to_doc) {
        console.log("test8->passed");
    } else {
        console.log("test8->failed");
        return res.status(100).json({ error: "could not send the notification" });
    }
    if (create_appointment && send_Notifi_to_doc) {
        return res.status(200).json(new ApiResponse(200, `appointment with dr${find_doctor?.name} has been made on ${find_patient?.appointmentStatus?.patient?.day, find_patient?.appointmentStatus?.patient?.time}`))
    }

});
exports.CancleAppointment = asyncHandler(async (req, res) => {

    const without__pipeline = async () => {

        const patient = await findUser(null, null, req.user.id);
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
            throw new ApiError(401, "you dont have an appointment");
        }

        const doctor = await Doctor.findById(req.params.id);
        if (doctor) {
            console.log("test3-passed");
        } else {
            console.log("test3-failed");
            return res.status(400).json({ error: "No doctor found" });
        }

        const decrement = doctor.patientStatus[0].number = Math.max(doctor.patientStatus[0].number - 1, 0);
        if (decrement) {
            console.log("test4->passed");
        } else {
            console.log("test4->failed");
            throw new ApiError(401, "could not decriment");
        }

        const save = await doctor.save()
        if (save) {
            console.log("test5->passed");
        } else {
            console.log("test5->failed");
        }

        const appointment = await Appontment.find({ doctor: doctor?.id, patient: patient?.id });
        if (appointment) {
            console.log("test6->passed")
        } else {
            console.log("test6->failed");
            throw new ApiError(400, "could not find the appointment associated with the id`s");
        }
        const updateUser = await User.findByIdAndUpdate(
            patient._id,
            {
                $set: { 'appointmentStatus.$[elem].appointment': false },
                $unset: { 'appointmentStatus.$[elem].patient': "" }
            },
            { arrayFilters: [{ 'elem.appointment': true }], new: true }
        )
        if (updateUser) {
            console.log("test7->passed");
        } else {
            console.log("test7->failed");
            throw new ApiError(400, 'could not update the user');
        }

        let deleteAppointment
        console.log(appointment.length)
        for (let i = 0; i < appointment?.length; i++) {
            let data = appointment[i]._id
            deleteAppointment = await Appontment.findByIdAndDelete(data)
            if (deleteAppointment) {
                console.log("test8->passed");
            } else {
                console.log("test8->failed");
                throw new ApiError(400, "could not delete the appointment");
            }
        }
        if (deleteAppointment) {
            console.log("all thest passed")
            return res.status(200).json(new ApiResponse(200, deleteAppointment, "appointment deleted"));
        } else {
            throw new ApiError(403, " error occured");
        }
    }
    const with__pipeline = async () => {
        const pipeline = await Doctor.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(req.params.id)
                }
            },
            {
                $addFields: {
                    toStr: {
                        $toString: "$_id"
                    }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "patientStatus.number",
                    foreignField: "appointmentStatus.patient.patientnumber",
                    as: "user"
                }
            },
            {
                $match: {
                    "user._id": new mongoose.Types.ObjectId(req.user.id)
                }
            }
        ]);
        if (pipeline.length === 0) {
            throw new ApiError(404, "No matching documents found");
        } else {
            const appointmentStatus = pipeline[0].user[0].appointmentStatus.find((status) => { return status?.appointment });
            if (!appointmentStatus) {
                throw new ApiError(403, "you dont have an appointment");
            }
            const decrement = pipeline[0].patientStatus[0].number = Math.max(pipeline[0].patientStatus[0].number - 1);
            if (!decrement) {
                throw new ApiError(400, "could not decrement");
            }
            const save = await pipeline.save();
            if (!save) {
                throw new ApiError(404, "could not save");
            }
            const updateUser = await User.findByIdAndUpdate(
                pipeline[0]?.user[0]?._id,
                {
                    $set: { 'appointmentStatus.$[elem].appointment': false },
                    $unset: { 'appointmentStatus.$[elem].patient': "" }
                },
                { arrayFilters: [{ 'elem.appointment': true }], new: true }
            );
            if (!updateUser) {
                throw new ApiError(400, "could not update the user");
            }

        }

        return res.status(200).json(new ApiResponse(200, { data: pipeline }, "pipeline"));
    };
    without__pipeline();
});
exports.History = asyncHandler(async (req, res) => {
    const without__pipeline = async () => {
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
    };
    const with__pipeline = async () => {
        const pipeline = await User.aggregate(
            [
                {
                    $match: { _id: new mongoose.Types.ObjectId(req.user?.id) }
                },
                {
                    $project: { history: 1 }
                },
                {
                    $unwind: "$history"
                },
                {
                    $lookup: {
                        from: "doctors",
                        localField: "history.doctorId",
                        foreignField: "_id",
                        as: "doctorDetails"
                    }
                },
                {
                    $unwind: "$doctorDetails"
                },
                {
                    $group: {
                        _id: "$_id",
                        doctorHistories: { $push: "$doctorDetails" }
                    }
                },
            ]
        )
        if (pipeline.length === 0) {
            throw new ApiError(403, "could not find")
        } else {
            return res.status(200).json(new ApiResponse(200, pipeline, "data"));

        }
    };
    with__pipeline();
});
