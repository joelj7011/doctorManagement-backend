const { Agenda } = require("agenda");
const Doctor = require("../Models/Doctor.Model");
const ApiError = require("../Utils/Apierror.Utils");
const User = require("../Models/User.Model");


const agenda = new Agenda({ db: { address: 'mongodb://localhost:27017/doctors' }, debug: true });
agenda?.on('ready', () => console.log('Agenda started successfully'))
agenda?.on('err', () => console.log('Agenda connection error:', err));
agenda.define(
    'remove expired availability', async (job) => {
        const { doctorId } = job.attrs.data;
        if (doctorId) {
            console.log("test1-passed", doctorId);

        } else {
            console.log("test2-failed");
            throw new ApiError(403, "data ws not recived")
        }
        try {
            const doctor = await Doctor.findById(doctorId);
            if (doctor) {
                console.log('test2-passed');
            } else {
                console.log("test2-failed");
                throw new ApiError(403, `doctor with ${doctorId} not found`);
            }

            const now = new Date();
            if (now) {
                console.log("test4-passed");
            } else {
                console.log("test4-failed");
                throw new ApiError(403, 'something went wrong');
            }
            const updatedAvailability = doctor.availability.filter((slot) => new Date(slot.end) > now);
            if (updatedAvailability) {
                console.log("test5-passed");
            } else {
                console.log("test5-failed");
                throw new ApiError(403, 'something went wrong  with the filter');
            }
            if (doctor.availability.length !== updatedAvailability.length) {
                doctor.availability = updatedAvailability;
                doctor.Max = 0;
                const save = await doctor.save();
                if (save) {
                    console.log("test4-passed");
                } else {
                    console.log("test4-failed");
                    throw new Error("Could not save doctor");
                }
            } else {
                console.log('No expired availability to remove for doctor:', doctorId);
            }
        } catch (error) {
            throw new ApiError(400, "something went wrong");
        }
    });

const agenda_delete_scheduled_appointments = new Agenda({ db: { address: 'mongodb://localhost:27017/doctors' }, debug: true });
agenda_delete_scheduled_appointments?.on('ready', () => console.log('Agenda started successfully'))
agenda_delete_scheduled_appointments?.on('err', () => console.log('Agenda connection error:', err));

agenda_delete_scheduled_appointments.define(
    'remove_appointment_after_expiery', async (job) => {
        try {
            const { doctorId } = job.attrs.data;
        } catch (error) {

        }
    }
)
    (async () => {
        await agenda.start();
        console.log('Agenda  started');
    })();



process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

module.exports = { agenda };