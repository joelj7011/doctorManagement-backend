const Doctor = require("../Models/Doctor.Model");
const { asyncHandler } = require("./AsyncHandler.Utiles");

exports.verifyAuthority = async (req, res, next, docId, day) => {
    console.log("verifying authority.....");

    let data;
    if (docId === null) {
        data = req.params.id;
    } else {
        data = docId;
    }
    const Day = day.toLowerCase();

    if (req.user.role === "doctor") {
        return res
            .status(401)
            .json({ success: false, message: "Unauthorized To Access This Resource" });
    } else if (req.params.id) {
        const findDoctor = await Doctor.findById(data);
        if (findDoctor) {
            console.log("test1->passed");
        } else {
            console.log("test1->failed");
            return res.status(400).json({ error: "doctor not found" });
        }

        const array = Object.entries(findDoctor);
        if (array) {
            console.log("test2->passed");
        } else {
            console.log("test2->failed");
            return res.status(400).json({ error: could`not convert the details in to an object error at:${__dirname}` })
        }
        console.log(Day);
        let existence_of_day = [];
        for (let i = 0; i <= array[2][1]?.availability.length; i++) {
            existence_of_day = array[2][1]?.availability?.map((status) => {
                return status.day === Day;
            });
        }
        console.log(existence_of_day)
        if (!existence_of_day[0]) {
            return res
                .status(400)
                .json({ success: false, meassage: "doctor is not available" })
        }

        if (req.isBookingAppointment && findDoctor?.max <= findDoctor?.availability?.laterNumber?.number) {
            return res
                .status(400)
                .json({ error: `${findDoctor?.name} is not taking any more clients we will update you if he is available` })
        }

        console.log("verify-authority-passed");

    }
};