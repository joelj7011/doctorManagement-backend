const Doctor = require("../Models/Doctor.Model");
const User = require("../Models/User.Model");
exports.verifyAuthority = async (req, docId, day) => {
  console.log("|");
  console.log("verifying authority.....");
  let data;
  let Day;

  if (docId === null) {
    data = req.params.id;
    console.log(data);
  } else {
    data = docId;
  }
  let authority = true;

  if (day !== null) {
    Day = day.toLowerCase();
  }

  if (req.user.role === "doctor") {
    return res.status(401).json({
      success: false,
      message: "Unauthorized To Access This Resource",
    });
  } else if (req.params.id) {
    let existence_of_day = [];
    const findDoctor = await Doctor.findById(data);
    if (findDoctor) {
      console.log("test1->passed");
    } else {
      console.log("test1->failed exiting Verify authority");
      return (authority = false);
    }

    if (day !== null) {
      const array = Object.entries(findDoctor);
      if (array) {
        console.log("test2->passed");
      } else {
        console.log("test2->failed");
        return (authority = false);
      }

      for (let i = 0; i <= array[2][1]?.availability.length; i++) {
        existence_of_day = array[2][1]?.availability?.find((status) => {
          return status.day === Day;
        });
      }
      console.log("existence_of_day->", existence_of_day);
      if (!existence_of_day.length === 0) {
        console.log("test3->failed");
        return (authority = false);
      } else {
        console.log("test3->passed");
      }

      const check_for_the_day = findDoctor?.availability
        ?.map((slot) => {
          return slot.day === existence_of_day?.day;
        })
        .filter(Boolean);
      if (check_for_the_day) {
        console.log("test4->passed");
      } else {
        console.log("test4->failed");
        return (authority = false);
      }

      if (
        req.isBookingAppointment &&
        findDoctor?.max <= findDoctor?.availability?.laterNumber?.number
      ) {
        return (authority = false);
      }
    }

    console.log("verifying ended.....");
    console.log("|");
    return {
      findDoctor: findDoctor,
      currentNumber: existence_of_day?.laterNumber?.number,
    };
  }
};

exports.validation = async (req) => {
  console.log("|");
  console.log("validation----started");
  let find_Doctor;
  let find_User;

  let validation = {
    success: true,
    message: "",
  };

  if (req.params?.id) {
    find_Doctor = await Doctor.findById(req.params.id);
    console.log(find_Doctor);
    if (!find_Doctor) {
      find_User = await User.findById(req.params.id);
      console.log(find_User);
      if (!find_User) {
        return (validation = {
          success: false,
          message: "could not retriev the date from the database",
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
      return (validation = {
        success: false,
        message: `User could not be found error at file ${__filename} at line:${getLineNumber()}`,
      });
    } else {
      return find_User;
    }
  } else if (req.doctor) {
    find_Doctor = await Doctor.findById(req.doctor?.id);
    if (!find_Doctor) {
      return (validation = {
        success: false,
        message: `doctor could not be found error at file ${__filename} at line:${getLineNumber()}`,
      });
    } else {
      return find_Doctor;
    }
  }
  console.log("validation----ended");
  console.log("|");
};

exports.message = async (req, res, status, message) => {
  if ((req, status, message)) {
    return res.status(status).json(message);
  }
};
