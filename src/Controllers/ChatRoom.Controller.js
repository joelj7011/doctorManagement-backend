const Doctor = require("../Models/Doctor.Model");
const User = require("../Models/User.Model");
const { asyncHandler } = require("../Utils/AsyncHandler.Utiles")


exports.sendMessage = asyncHandler(async (req, res) => {
    const { message } = req.body;
    if (typeof (message) === String) {
        console.log("test1->passed");
    } else {
        console.log("test1->failed");
        return res.status(403).json({ error: `error at ${__filename} at line ${getLineNumber()}` });
    }

    const find_Patient = await User.findById(req.user?.id);
    if (find_Patient) {
        console.log("test2->passed");
    } else {
        console.log("test2->failed");
        return res.status(404).json({ error: `error at ${__filename} at line ${getLineNumber()}` });
    }

    const find_Doctor = await Doctor.findById(req.params?.id);
    if (find_Doctor) {
        console.log("test3->passed");
    } else {
        console.log("test3->failed");
        return res.status(404).json({ error: `error at ${__filename} at line ${getLineNumber()}` });
    }
})