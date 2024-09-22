const ApiResponse = require("../Utils/Apiresponse.utils");
const { filterdetail, options, convertToISOTime } = require("../../Constants");
const Appontment = require("../Models/Appointment.Models");
const User = require("../Models/User.Model");
const Doctor = require("../Models/Doctor.Model");
const ApiError = require("../Utils/Apierror.Utils");
const { asyncHandler } = require("../Utils/AsyncHandler.Utiles");
const { default: mongoose } = require("mongoose");
const Notification = require("../Models/Notification.Model");
const { verifyAuthority, message } = require("../Utils/VerfiyAuthority");
const { getLineNumber } = require("../Utils/ErrorAtLine");
const { Day_time_managment } = require("../Utils/Utility.Utils.");

exports.getuserData = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user?.id);
  if (user) {
    console.log("test-1-passed");
  } else {
    console.log("test2-failed");
    return res.status(403).json({
      error: "user data was not recived",
      details: { location: __filename, Line: getLineNumber() },
    });
  }

  const filterdetails = filterdetail(user);
  if (filterdetails) {
    console.log("test1->passed");
    return res
      .status(200)
      .json(new ApiResponse(200, filterdetails, "user fetched successfully"));
  } else {
    console.log("test1->failed");
    return res.status(500).json({
      error: "could not fetch the user",
      details: { location: __filename, Line: getLineNumber() },
    });
  }
});
exports.fetchAllDoctors = asyncHandler(async (req, res, next) => {
  let role = "doctor";
  const doctors = await Doctor.find({ role: role });
  console.log(doctors);
  if (doctors) {
    console.log("test1-passed");
  } else {
    console.log("test1-failed");
    return res.status(403).json({ error: "date was not transfered" });
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
    return res
      .status(500)
      .json({ error: "no data recived from the filterdetails" });
  }
});
exports.BookAppointment = asyncHandler(async (req, res) => {
  const find_Patient = await User.findById(req.user.id);
  if (find_Patient) {
    console.log("test1-passed");
  } else {
    console.log("test1-failed");
    return res.status(403).json({ error: "no user found" });
  }

  const now = new Date();
  if (now) {
    console.log("test2-passed");
  } else {
    console.log("test2-failed");
    return res.status(500).json({ error: "could not create new date" });
  }

  const time = now.toISOString().slice(0, -14).trim(" ");
  if (time) {
    console.log("test3->passed");
  } else {
    console.log("test3->failed");
    return res.status(500).json({ error: "could not create the time" });
  }

  const currentDay = now
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();

  if (currentDay) {
    console.log("test4->passed", currentDay);
  } else {
    console.log("test4->failed");
    return res.status(500).json({ error: "could not create the CurrentDay" });
  }

  const date = Day_time_managment(currentDay, null);
  if (date) {
    console.log("test5->passed");
  } else {
    console.log("test5->failed");
    return res.status(500).json({ error: "could not create the CurrentTime" });
  }

  const authority_check = await verifyAuthority(req, null, currentDay);
  if (authority_check) {
    console.log("test6->passed");
  } else {
    console.log("test6->failed");
    return res.status(500).json({ error: "error occured while verifying" });
  }

  let appointment_Exists = [];
  for (let i = 0; i < find_Patient?.appointmentStatus?.length; i++) {
    let patientStatus = find_Patient?.appointmentStatus[i]?.patient?.find(
      (status) => {
        return status.day === currentDay;
      }
    );
    if (patientStatus) {
      appointment_Exists.push(patientStatus);
    }
  }
  if (appointment_Exists.length > 0) {
    console.log("test7-failed");
    return res
      .status(500)
      .json({ error: "You already have an appointment booked" });
  } else {
    console.log("test7-passed");
  }

  const update_doctor_availability_laterpatient =
    await Doctor.findByIdAndUpdate(
      authority_check?.findDoctor._id,
      { $inc: { "availability.$[elem].laterNumber.number": 1 } },
      { arrayFilters: [{ "elem.day": currentDay }], new: true }
    );
  if (update_doctor_availability_laterpatient) {
    console.log(update_doctor_availability_laterpatient);
    console.log("test8->passed");
  } else {
    console.log("test8->failed");
    return res.status(500).json({ error: "could not incriment" });
  }

  const update_Patient_status = await User.findByIdAndUpdate(
    find_Patient?._id,
    {
      $push: {
        appointmentStatus: {
          appointment: true,
          patient: {
            patientnumber:
              update_doctor_availability_laterpatient?.availability[0]
                ?.laterNumber.number,
            time: time,
            day: currentDay,
            date: date?.date,
          },
        },
        history: authority_check?.findDoctor?._id,
      },
    },
    { new: true }
  );
  console.log(update_Patient_status);
  if (update_Patient_status) {
    console.log("test9->passed");
  } else {
    console.log("test9->failed");
    return res.status(500).json({ error: "could  not update the patient" });
  }

  const appointment = await Appontment.create({
    doctor: authority_check?.findDoctor?._id,
    patient: find_Patient._id,
    laterPatient: [
      {
        day: currentDay,
        date: date?.date,
      },
    ],
  });
  if (appointment) {
    console.log("test10->passed");
    return res
      .status(200)
      .json(new ApiResponse(200, update_Patient_status, "appointment booked "));
  } else {
    console.log("test10->failed");
    return res
      .status(500)
      .json({ error: "could not update create the appoibtment" });
  }
});
exports.BookAppointmentManually = asyncHandler(async (req, res) => {
  const { day, time } = req?.body;
  if (day && time && day.trim(" ") && time.trim(" ")) {
    console.log("test1->passed");
  } else {
    console.log("test1->failed");
    return res.status(400).json({ error: "all filds are required" });
  }

  const date = Day_time_managment(day, null);
  if (date) {
    console.log("test2->passed");
  } else {
    console.log("test2->failed");
    return res.status(500).json({ error: "could not create the date " });
  }

  const Isos_time = convertToISOTime(time);
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
    return res.status(403).json({ error: "could not find the user" });
  }

  const authority_check = await verifyAuthority(req, null, day);
  console.log(authority_check?.findDoctor?._id);
  if (authority_check) {
    console.log("test4->passed");
  } else {
    console.log("test4->failed");
    return res.status(500).json({ error: "error occured while verifying" });
  }

  const update_doctor_availability_laterpatient =
    await Doctor.findByIdAndUpdate(
      authority_check?.findDoctor?._id,
      { $inc: { "availability.$[elem].laterNumber.number": 1 } },
      { arrayFilters: [{ "elem.day": day }], new: true }
    );
  if (update_doctor_availability_laterpatient) {
    console.log("test5->passed");
  } else {
    console.log("test5->failed");
    return res.status(500).json({ error: "could not incriment" });
  }

  const exis_Appoint_with_same_date_time = await Appontment.find({
    doctor: authority_check?.findDoctor?.id,
    patient: find_patient?.id,
    laterPatient: {
      $elemMatch: {
        day: day,
        date: date?.date,
        Time: Isos_time,
      },
    },
  });
  if (exis_Appoint_with_same_date_time.length > 0) {
    console.log("test6->failed");
    return res
      .status(400)
      .json({ error: `appointment on  ${day} is allready booked` });
  } else {
    console.log("test6->passed");
  }

  const time_check = find_patient?.appointmentStatus?.some((slot) => {
    return slot?.patient?.some((time) => {
      return time.time === Isos_time;
    });
  });
  console.log("time_check->", find_patient?.appointmentStatus);
  if (time_check === undefined || time_check) {
    console.log("test7->failed");
    return message(req, res, 500, {
      error: "you have an appointment at this hour",
    });
  } else {
    console.log("test7->passed");
  }

  const extract_number =
    update_doctor_availability_laterpatient?.availability?.find((slot) => {
      return slot?.day === day;
    });
  if (extract_number) {
    console.log("test8->passed", extract_number);
  } else {
    return message(req, res, 500, { error: "could not extract the nu,ber" });
  }

  const update_Patient_status = await User.findByIdAndUpdate(
    find_patient?._id,
    {
      $push: {
        appointmentStatus: {
          appointment: true,
          patient: {
            patientnumber: extract_number?.laterNumber?.number,
            time: Isos_time,
            day: extract_number?.day,
            date: extract_number?.date,
          },
        },
        history: {
          doctorId: authority_check?.findDoctor?.id,
          date: extract_number?.date,
        },
      },
    }
  );
  if (update_Patient_status) {
    console.log("test8->passed");
  } else {
    console.log("test8->failed");
    return res
      .status(400)
      .json({ errro: "could not  update the patient status" });
  }

  const create_appointment = await Appontment.create({
    doctor: authority_check?.findDoctor?.id,
    patient: find_patient?.id,
    laterPatient: [
      {
        day: day,
        date: date?.date,
        AppointmentAt: extract_number?.date,
        Time: Isos_time,
      },
    ],
  });
  if (create_appointment) {
    console.log("test9->passed");
  } else {
    console.log("test9->failed");
    return res.status(100).json({ error: "could not create appointment" });
  }

  const notification = [
    {
      reciver: {
        type: authority_check?.findDoctor?._id,
        role: authority_check?.findDoctor?.role,
      },
      message: `you have a patient dr:${authority_check?.findDoctor?.name}`,
    },
    {
      reciver: {
        type: find_patient?._id,
        role: find_patient?.role,
      },
      message: `your Booked an appointment on ${date?.date} with dr:${authority_check?.findDoctor?.name}`,
    },
  ];
  const send_Notifi_to_doc_pati = await Notification.insertMany(notification);
  if (send_Notifi_to_doc_pati) {
    console.log("test9->passed");
  } else {
    console.log("test9->failed");
    return res.status(100).json({ error: "could not send the notification" });
  }

  if (create_appointment && send_Notifi_to_doc_pati) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          `appointment with dr${
            authority_check?.findDoctor?.name
          } has been made on ${
            (find_patient?.appointmentStatus?.patient?.day,
            find_patient?.appointmentStatus?.patient?.time)
          }`
        )
      );
  }
});
exports.CancleAppointment = asyncHandler(async (req, res, next) => {
  const without__pipeline = async () => {
    const find_Patient = await User.findById(req.user?.id);
    if (find_Patient) {
      console.log("test1-passed");
    } else {
      console.log("test1-failed");
      return message(req, res, 403, { error: "no user found" });
    }

    const find_appointmentn = await Appontment.findById(req?.params?.id);
    if (find_appointmentn) {
      console.log("test2->passed");
    } else {
      console.log("test2->failed");
      return message(req, res, 500, { error: "appoinment could not be found" });
    }

    const { day, date, AppointmentAt, Time } = await find_appointmentn
      ?.laterPatient[0];
    if ((day, date)) {
      console.log("test3->passed");
    } else {
      console.log("test3->failed");
      return message(req, res, 500, "could not destructure day and date");
    }

    const authority_check = await verifyAuthority(
      req,
      find_appointmentn?.doctor,
      null
    );
    if (authority_check) {
      console.log("test4->passed");
    } else {
      console.log("test4->failed");
      return message(req, res, 500, { error: " authority check failed" });
    }

    const match_day_time_with_appoint = find_Patient?.appointmentStatus?.find(
      (slot) => {
        console.log(slot);
        return slot.patient?.some((patient) => {
          return (
            patient.day === day &&
            patient.date === AppointmentAt &&
            patient.time === Time
          );
        });
      }
    );
    if (match_day_time_with_appoint) {
      console.log("test5->passed");
    } else {
      console.log("test5->failed");
      return message(req, res, 500, {
        error: "could not find any document as per the criteria",
      });
    }

    const remove_User_Documente = find_Patient?.appointmentStatus?.filter(
      (slot) => {
        return slot.appointment !== match_day_time_with_appoint?.appointment;
      }
    );
    console.log("remove_User_Documente", remove_User_Documente);
    if (
      remove_User_Documente &&
      remove_User_Documente?.length !== find_Patient?.availability
    ) {
      find_Patient.appointmentStatus = remove_User_Documente;

      const Save = await find_Patient.save();
      if (!Save) {
        return res.status(500).json({ error: "could not save" });
      }
      console.log("test6->passed");
    } else {
      console.log("test6->failed");
      return res.status(500).json({ errora: "could not update the user" });
    }

    const decrement_Doctor_number = await Doctor.updateOne(
      { _id: authority_check?.findDoctor?._id },
      {
        $inc: {
          "availability.$[elem].laterNumber.number": -1,
        },
      },
      {
        arrayFilters: [{ "elem.day": day }],
        new: true,
      }
    );
    if (decrement_Doctor_number.modifiedCount > 0) {
      console.log("test7->passed");
    } else {
      console.log("test7->failed");
      return res.status(500).json({ error: "could not decrement" });
    }

    const delete_The_Appointment = await Appontment.findByIdAndDelete(
      find_appointmentn?._id
    );
    if (delete_The_Appointment) {
      console.log("test8->all test passed");
      return res
        .status(200)
        .json(
          new ApiResponse(200, delete_The_Appointment, "appointment deleted")
        );
    } else {
      console.log("test8->failed");
      throw new ApiError(500, "could not delete the appointment");
    }
  };

  const with__pipeline = async () => {
    const pipeline = await Doctor.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.params.id),
        },
      },
      {
        $addFields: {
          toStr: {
            $toString: "$_id",
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "patientStatus.number",
          foreignField: "appointmentStatus.patient.patientnumber",
          as: "user",
        },
      },
      {
        $match: {
          "user._id": new mongoose.Types.ObjectId(req.user.id),
        },
      },
    ]);
    if (pipeline.length === 0) {
      throw new ApiError(404, "No matching documents found");
    } else {
      const appointmentStatus = pipeline[0].user[0].appointmentStatus.find(
        (status) => {
          return status?.appointment;
        }
      );
      if (!appointmentStatus) {
        throw new ApiError(403, "you dont have an appointment");
      }
      const decrement = (pipeline[0].patientStatus[0].number = Math.max(
        pipeline[0].patientStatus[0].number - 1
      ));
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
          $set: { "appointmentStatus.$[elem].appointment": false },
          $unset: { "appointmentStatus.$[elem].patient": "" },
        },
        { arrayFilters: [{ "elem.appointment": true }], new: true }
      );
      if (!updateUser) {
        throw new ApiError(400, "could not update the user");
      }
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { data: pipeline }, "pipeline"));
  };
  without__pipeline();
});
exports.History = asyncHandler(async (req, res) => {
  let doctorHistories = [];
  let finalResult = [];
  const patient = await User.findById(req.user?.id);
  if (patient) {
    console.log("test1->passed");
  } else {
    console.log("test1->failed");
    return message(req, res, 403, { error: "patient not found" });
  }

  const toarray = Object.entries(patient);
  if (Array.isArray(toarray)) {
    console.log("test2->passed");
  } else {
    console.log("test2->failed");
    return message(req, res, 500, {
      error: "could not convert it to an array",
    });
  }

  const history = toarray[2][1]?.history
    .map((status) => {
      return status?.doctorId.toString();
    })
    .filter(Boolean);
  if (history.length > 0) {
    console.log("test3->passed");
  } else {
    console.log("test3->failed");
    throw new ApiError(500, "history not found");
  }
  console.log(history);

  if (history && history.length > 0) {
    for (let i = 0; i <= history.length - 1; i++) {
      const doctor_Id = history[i];
      const doctorHistory = await Doctor.findById(doctor_Id);
      if (!doctorHistories) {
        return message(req, res, 403, { error: "could not find the user" });
      }
      doctorHistories.push(doctorHistory);
    }
  }
  if (doctorHistories.length === 0) {
    console.log("test4->failed");
    return message(req, res, 500, {
      error: "ypu havent booked any appointment",
    });
  } else {
    console.log("test4->passsed");
  }
  for (let i = 0; i < doctorHistories?.length; i++) {
    let include = true;
    if (finalResult?.length === 0) {
      finalResult?.push(doctorHistories[i]);
    } else {
      if (
        i < doctorHistories.length - 1 &&
        doctorHistories[i]?.id === doctorHistories[i + 1]?.id
      ) {
        include = false;
      }
      if (include) {
        finalResult?.push(doctorHistories[i]);
      }
    }
  }

  const filterd = await filterdetail(finalResult);
  if (filterd.length > 0) {
    console.log("test4->passed");
    return res.status(200).json(new ApiResponse(200, finalResult, "data fetched "));
  } else {
    console.log("test4->failed");
    throw new ApiError(500, "could not populate the array");
  }
});
exports.getDoctorDetails = asyncHandler(async (req, res) => {
  const find_user = await User.findById(req.user?.id);
  if (find_user) {
    console.log("test-1-passed");
  } else {
    console.log("test2-failed");
    return res.status(403).json({ error: "could not find the user" });
  }

  const find_doctor = await Doctor.findById(req.params?.id);
  if (find_doctor) {
    console.log("test2->passed");
  } else {
    console.log("test2->failed");
    return res.status(403).json({ error: "could not find the doctor" });
  }

  const filter = filterdetail(find_doctor);
  if (filter) {
    console.log("test3->passed");
    return (
      res.status(200), json(new ApiResponse(200, filter, "details fetched"))
    );
  } else {
    console.log("test3->failed");
    return res.status(500).json({ errro: "could not filter the data" });
  }
});
