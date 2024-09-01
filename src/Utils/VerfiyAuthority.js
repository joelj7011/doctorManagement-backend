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
    return res.status(401).json({
      success: false,
      message: "Unauthorized To Access This Resource",
    });
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
      return res.status(400).json({
        error: `could not convert the details in to an object error at:${__filename}`,
      });
    }

    let existence_of_day = [];
    for (let i = 0; i <= array[2][1]?.availability.length; i++) {
      existence_of_day = array[2][1]?.availability?.map((status) => {
        return status.day === Day;
      });
    }
    if (!existence_of_day[0]) {
      return res
        .status(400)
        .json({ success: false, meassage: "doctor is not available" });
    }

    if (
      req.isBookingAppointment &&
      findDoctor?.max <= findDoctor?.availability?.laterNumber?.number
    ) {
      return res.status(400).json({
        error: `${findDoctor?.name} is not taking any more clients we will update you if he is available`,
      });
    }
    console.log("verify-authority-passed");
  }
};

exports.validation = async (req, res) => {
  let find_Doctor;
  let find_User;

  if (req.params?.id) {
    find_Doctor = await Doctor.findById(req.params.id);
    if (!find_Doctor) {
      find_User = await User.findById(req.params.id);
      if (!find_User) {
        return res.status(404).json({
          error: `User with ID ${
            req.params.id
          } could not be found at file ${__filename} at line ${getLineNumber()}.`,
        });
      } else {
        return find_User;
      }
    } else {
      return find_Doctor;
    }
  } else if (req.user) {
    find_User = await User.findById(req.user?.id);
    if (!find_User) {
      return res.status(404).json({
        error: `User could not be found error at file ${__filename} at line:${getLineNumber()}`,
      });
    } else {
      return find_User;
    }
  } else if (req.doctor) {
    find_Doctor = await Doctor.findById(req.doctor?.id);
    if (!find_Doctor) {
      return res.status(404).json({
        error: `doctor could not be found error at file ${__filename} at line:${getLineNumber()}`,
      });
    } else {
      return find_Doctor;
    }
  }
};
