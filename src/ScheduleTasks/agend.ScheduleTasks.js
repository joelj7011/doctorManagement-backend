const { Agenda } = require("agenda");
const Doctor = require("../Models/Doctor.Model");
const ApiError = require("../Utils/Apierror.Utils");
const Appontment = require("../Models/Appointment.Models");
const User = require("../Models/User.Model");
const { updateAvailabilityDates } = require("../Utils/Utility.Utils.");
const moment = require("moment");
const { asyncHandler } = require("../Utils/AsyncHandler.Utiles");

const agenda = new Agenda({
  db: { address: "mongodb://localhost:27017/DoctorManagment" },
  debug: true,
  maxConcurrency: 5,
});

agenda?.on("ready", () => console.log("Agenda started successfully"));

agenda?.on("err", () => console.log("Agenda connection error:", err));

agenda.define(
  "remove expired availability",
  asyncHandler(async (job) => {
    const { doctorId } = job.attrs.data;
    let update_data = [];
    const now = moment();
    let next_date;
 

    if (doctorId) {
      console.log("test1-passed", doctorId);
    } else {
      console.log("test1-failed");
      throw new ApiError(500, "could not find the doctorid");
    }

    const doctor = await Doctor.findById(doctorId);
    if (doctor) {
      console.log("test2-passed");
    } else {
      console.log("test2-failed");
      throw new ApiError(403, `doctor with ${doctorId} not found`);
    }

    //collects the passed day in to an array[]
    for (let i = 0; i <= doctor?.availability?.length; i++) {
      if (!doctor?.availability[i]?.date) {
        console.log(moment(doctor?.availability[i]?.date));
      }
      if (moment(doctor?.availability[i]?.date).isBefore(now)) {
        let isAfterAll = true;
        for (let j = 0; j < doctor?.availability?.length; j++) {
          if (i !== j && moment(doctor?.availability[i]?.date).isAfter(now)) {
            isAfterAll = false;
            break;
          }
        }
        if (isAfterAll) {
          update_data.push(doctor?.availability[i]?.day);
        }
      }
    }

    //normalizes the day stored inside an array[]
    const normalizedUpdateData = update_data.map((day) => day.toLowerCase());
    if (normalizedUpdateData.length > 0) {
      console.log("test3->passed", normalizedUpdateData);
    } else {
      console.log("test3->failed");
      throw new ApiError(500, "could not normalize");
    }

    //to get the next date of the week for a particular day
    next_date = updateAvailabilityDates(normalizedUpdateData);
    if (next_date) {
      console.log("test4->passed");
    } else {
      console.log("test4->failed");
      throw new ApiError(500, "no next date");
    }

    //updating the particular day with the next date of the week for the same day
    for (let i = 0; i < normalizedUpdateData?.length; i++) {
      await Doctor.findByIdAndUpdate(
        doctor?.id,
        {
          $set: {
            "availability.$[elem].date": next_date[i],
            "availability.$[elem].laterNumber": {
              number: 0,
            },
          },
        },
        {
          arrayFilters: [{ "elem.day": normalizedUpdateData[i] }],
          new: true,
        }
      );
    }

    const fetch_Patient_id = await Appontment.find({ doctor: doctor?.id });
    if (fetch_Patient_id) {
      console.log("test4->passed");
    } else {
      console.log("test4->failed");
      return res
        .status(500)
        .json({ error: "could not find the patient_id  in appointment" });
    }

    let index = 0;
    const current_date_patient_filter = fetch_Patient_id.filter(
      (currentDatePatient) => {
        return currentDatePatient.date === doctor.availability.date;
      }
    );

    while (index < fetch_Patient_id.length) {
      const fetch_patient = await User.findById(
        current_date_patient_filter[index].patient
      );
      if (fetch_patient) {
        console.log("text5->passed");
      } else {
        console.log("text5->passed");
        return res
          .status(403)
          .json({ error: "could not find the patient eith the provided id" });
      }

      const unset_Appointmentstatus_of_patient = await User.findByIdAndUpdate(
        fetch_patient?.id,
        {
          $set: { appointmentStatus: [] },
        },
        { new: true }
      );
      if (unset_Appointmentstatus_of_patient) {
        console.log("text6->passed");
      } else {
        console.log("text6->failed");
        return res.status(500).json({ error: "could not empty the array" });
      }
      index++;
    }

    console.log("test->completed");
  })
);

(async () => {
  await agenda.start();
  console.log("Agenda  started");
})();

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

module.exports = { agenda };
