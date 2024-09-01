const Doctor = require("../Models/Doctor.Model");
const Messages = require("../Models/Message.Model");
const User = require("../Models/User.Model");
const Socket = require("../Services/Socket.Services");
const { asyncHandler } = require("../Utils/AsyncHandler.Utiles");
const { getLineNumber } = require("../Utils/ErrorAtLine");


exports.sendMessage = asyncHandler(async (req, res) => {
    const { message, role } = req.body;
    if (typeof (message) && typeof (role) === String) {
        console.log("test1->passed");
    } else {
        console.log("test1->failed");
        return res.status(403).json({ error: `error at ${__filename} at line ${getLineNumber()}` });
    }

    const encrypt_message = encrypt(message);
    if (encrypt_message) {
        console.log("test2->passee");
    } else {
        console.log("test2->failed");
        return res.status(400).json({ error: "could not encrypt the message" });
    }

    const find_Patient = await User.findById(req.user?.id);
    if (find_Patient) {
        console.log("test3->passed");
    } else {
        console.log("test3->failed");
        return res.status(404).json({ error: `error at ${__filename} at line ${getLineNumber()}` });
    }

    const find_Doctor = await Doctor.findById(req.params?.id);
    if (find_Doctor) {
        console.log("test4->passed");
    } else {
        console.log("test4->failed");
        return res.status(404).json({ error: `error at ${__filename} at line ${getLineNumber()}` });
    }

    const store_message = await Messages.create({
        from: req.user?.id ?? req.doctor?.id,
        to: req.params?.id,
        role: role,
        message: encrypt_message
    });
    if (store_message) {
        console.log("test5->passed");
    } else {
        console.log("test5->failed");
        return res.status(404).json({ error: `could not save messages error at ${__filename} at line ${getLineNumber()}` });
    }

    const io = Socket.get_Io(res);
    if (io) {
        console.log("test6->passed");
    } else {
        console.log("tes6->failed");
        return res.status(400).json({ error: `could not retrive the io error at ${__filename} at line ${getLineNumber()}` });
    }

    io.to()
})