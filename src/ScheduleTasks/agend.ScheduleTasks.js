const { Agenda } = require("agenda");
const Doctor = require("../Models/Doctor.Model");
const ApiError = require("../Utils/Apierror.Utils");
const Appontment = require("../Models/Appointment.Models");
const User = require("../Models/User.Model");

const agenda = new Agenda({
  db: { address: "mongodb://localhost:27017/doctors" },
  debug: true,
});
agenda?.on("ready", () => console.log("Agenda started successfully"));
agenda?.on("err", () => console.log("Agenda connection error:", err));
agenda.define("remove expired availability", async (job) => {
  const { doctorId, day } = job.attrs.data;
  if (doctorId) {
    console.log("test1-passed", doctorId);
  } else {
    console.log("test1-failed");
    throw new ApiError(403, "data ws not recived");
  }

  try {
    const doctor = await Doctor.findById(doctorId);
    if (doctor) {
      console.log("test2-passed");
    } else {
      console.log("test2-failed");
      throw new ApiError(403, `doctor with ${doctorId} not found`);
    }

    const now = new Date();
    if (now) {
      console.log("test3-passed");
    } else {
      console.log("test3-failed");
      throw new ApiError(403, "something went wrong");
    }

    const dayOfWeek = date.getDay();
    if (dayOfWeek) {
      console.log("test4-passed");
    } else {
      console.log("test4-failed");
      throw new ApiError(403, "something went wrong");
    }

    const accurateday = Day_time_managment(day, null);
    if (accurateday) {
      console.log("test5-passed");
    } else {
      console.log("test5-failed");
      throw new ApiError(403, "something went wrong");
    }
    console.log("accurateday", accurateday);

    const updatedAvailability = doctor.availability.filter(
      (slot) => new Date(slot.end) > now
    );
    if (updatedAvailability !== null) {
      console.log("test5-passed");
    } else {
      console.log("test5-failed");
      throw new ApiError(403, "something went wrong  with the filter");
    }

    if (doctor.availability.length !== updatedAvailability.length) {
      const fetch_Patient_id = await Appontment.find({ doctor: doctor?.id });
      if (fetch_Patient_id) {
        console.log("test6->passed");
      } else {
        console.log("test6->failed");
        return res
          .status(500)
          .json({ error: "could not find the patient_id  in appointment" });
      }

      console.log(fetch_Patient_id.length);
      let index = 0;
      const current_date_patient_filter = fetch_Patient_id.filter(
        (currentDatePatient) => {
          return currentDatePatient.date === doctor.availability.date;
        }
      );
      console.log(current_date_patient_filter);

      while (index < fetch_Patient_id.length) {
        const fetch_patient = await User.findById(
          current_date_patient_filter[index].patient
        );
        if (fetch_patient) {
          console.log("text7->passed");
        } else {
          console.log("text7->passed");
          return res
            .status(403)
            .json({ error: "could not find the patient eith the provided id" });
        }
        console.log("---->", fetch_patient);

        const unset_Appointmentstatus_of_patient = await User.findByIdAndUpdate(
          fetch_patient?.id,
          {
            $set: { appointmentStatus: [] },
          },
          { new: true }
        );
        if (unset_Appointmentstatus_of_patient) {
          console.log("text8->passed");
        } else {
          console.log("text8->failed");
          return res.status(500).json({ error: "could not empty the array" });
        }

        index++;
      }

      doctor.availability = updatedAvailability;
      doctor.Max = 0;
      const save = await doctor.save();
      if (save) {
        console.log("test9-passed");
      } else {
        console.log("test9-failed");
        throw new Error("Could not save doctor");
      }
    } else {
      console.log("No expired availability to remove for doctor:", doctorId);
    }
  } catch (error) {
    throw new ApiError(400, "something went wrong");
  }
});

// const agenda_delete_scheduled_appointments = new Agenda({ db: { address: 'mongodb://localhost:27017/doctors' }, debug: true });
// agenda_delete_scheduled_appointments?.on('ready', () => console.log('Agenda started successfully'))
// agenda_delete_scheduled_appointments?.on('err', () => console.log('Agenda connection error:', err));

// agenda_delete_scheduled_appointments.define(
//     'remove_appointment_after_expiery', async (job) => {
//         try {

//         } catch (error) {

//         }
//     }
// )
(async () => {
  await agenda.start();
  console.log("Agenda  started");
  // await agenda_delete_scheduled_appointments.start();
  // console.log('agenda_delete_scheduled_appointments  started');
})();

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

module.exports = { agenda };
