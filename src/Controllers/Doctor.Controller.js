const moment = require("moment");
const {
  options,
  filterdzzetail,
  convertToISOTime,
  filterdetail,
} = require("../../Constants");
const Appontment = require("../Models/Appointment.Models");
const Doctor = require("../Models/Doctor.Model");
const User = require("../Models/User.Model");
const ApiError = require("../Utils/Apierror.Utils");
const ApiResponse = require("../Utils/Apiresponse.utils");
const catchAsyncErrors = require("../Utils/CatchAsyncError.util");
const { GenerateTokens } = require("../Utils/SendToken.utils");
const { agenda } = require("../ScheduleTasks/agend.ScheduleTasks");
const { default: mongoose } = require("mongoose");
const { asyncHandler } = require("../Utils/AsyncHandler.Utiles");
const { Day_time_managment } = require("../Utils/Utility.Utils.");

exports.getDoctorData = asyncHandler(async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.doctor.id);
    if (doctor) {
      console.log("test-1-passed");
    } else {
      console.log("test2-failed");
      throw new ApiError(403, "data was not found");
    }
    const filterdetails = filterdetail(doctor);
    if (filterdetails) {
      console.log("test1->passed");
      return res
        .status(200)
        .json(
          new ApiResponse(200, filterdetails, "docotr fetched successfully")
        );
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
      return res.status(401).json({ error: "all fields are required" });
    }

    const scheduledTime = Day_time_managment(day, end);
    if (scheduledTime) {
      console.log("test2->passed");
    } else {
      console.log("test2->failed");
      return (
        res.status(500), json({ error: "function failed to produce result" })
      );
    }

    const startTimeISO = convertToISOTime(start).slice(11, -4);
    if (startTimeISO) {
      console.log(startTimeISO);
      console.log("test2-passed");
    } else {
      console.log("test2-failed");
      return res.status(500).json({ error: "conversion to ISOS failed" });
    }

    const endTimeISO = convertToISOTime(end).slice(11, -4);
    if (endTimeISO) {
      console.log(endTimeISO);
      console.log("test3-passed");
    } else {
      console.log("test3-failed");
      return res.status(500).json({ error: " conversion to ISOS failed" });
    }

    const find_doctor = await Doctor.findById(req.doctor?.id);
    if (find_doctor) {
      console.log("test4->passed");
    } else {
      console.log("test4->failed");
      return res.status(403).json({ error: "could not find the doctor" });
    }

    const array = find_doctor?.availability?.find((status) => {
      return status.day === day;
    });
    if (array || array?.length > 0) {
      console.log("test5->failed");
      return res
        .status(500)
        .json({ error: "day with same timing already exists " });
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
            date: scheduledTime.date,
            available: true,
          },
        },
        $set: { Max: HowManyPatients },
      },
      { new: true }
    );
    if (update_doctor_availability) {
      console.log("test6->passed");
    } else {
      console.log("test6->failed");
      return res.status(500).json({ errro: "details could not be updated" });
    }

    const job = await agenda.schedule(
      scheduledTime.targetDateTime,
      "remove expired availability",
      { doctorId: find_doctor._id, day: day }
    );
    if (!job) {
      console.log("test7->failed");
      return res.status(500).json({ errro: "Error occurred with the job" });
    } else {
      console.log("test7->passed");
      console.log(
        `Scheduled job with ID ${job.attrs._id} for doctor ${find_doctor._id} at ${endTimeISO}`
      );
      return res.json(
        new ApiResponse(200, find_doctor, "criteria has been set")
      );
    }
  } catch (error) {
    catchAsyncErrors(error, req, res);
  }
});
exports.getDetailOfthePatient = asyncHandler(async (req, res) => {
  try {
    const pipeline = await Doctor.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.doctor.id),
        },
      },
      {
        $addFields: {
          _idStr: { $toString: "$_id" },
        },
      },
      {
        $lookup: {
          from: "appointments",
          localField: "_idStr",
          foreignField: "doctor",
          as: "result",
        },
      },
      {
        $unwind: {
          path: "$result",
        },
      },
      {
        $group: {
          _id: "$_id",
          totalAppointments: { $sum: 1 },
          appointments: { $push: "$result" },
        },
      },
      {
        $project: {
          appointments: 1,
        },
      },
    ]);
    if (pipeline.length === 0) {
      throw new ApiError(403, "could not find any data");
    }

    return res.json(new ApiResponse(200, { data: pipeline }, "hello"));
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
      return Doctor.findByIdAndUpdate(
        req.doctor?.id,
        {
          $unset: { "patientStatus.0.number": -1 },
        },
        { new: true }
      );
    })
    .then((updatedDoctor) => {
      console.log(updatedDoctor);
      return User.findByIdAndUpdate(
        req.params?.id,
        {
          $unset: {
            "appointmentStatus.$[elem].appointment": false,
            "appointmentStatus.$[elem].patient": "",
            "appointmentStatus.$[elem].time": "",
            "appointmentStatus.$[elem].day": "",
            "appointmentStatus.$[elem].data": null,
          },
        },
        {
          arrayFilters: [{ "elem.appointment": true }],
        }
      ).then((updatedUser) => {
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
