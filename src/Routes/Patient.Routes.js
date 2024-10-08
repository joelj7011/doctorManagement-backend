const router = require("express").Router();
const {
  fetchAllDoctors,
  BookAppointment,
  CancleAppointment,
  getuserData,
  History,
  BookAppointmentManually,
  getDoctorDetails,
} = require("../Controllers/Patient.Controller");
const {
  createUser,
  loginUser,
  logout,
  forgotPass,
  refreshAccessToken,
} = require("../Controllers/Authentication.Controllers");
const { authentication } = require("../Middleware/auth.Middleware");
const { body } = require("express-validator");
const upload = require("../Middleware/Multer.Middleware");
const { cacheMiddlWare, setCahe } = require("../Middleware/Caching.Middleware");

router.post(
  "/createuser",
  upload.single("profileImage"),
  [
    body("name")
      .custom((value) => {
        if (!value || value.trim().length <= 3) {
          throw new Error("Name is too short");
        }
        return true;
      })
      .withMessage("Name is too short"),

    body("email").isEmail().withMessage("Invalid email address"),

    body("password").isLength({ min: 5 }).withMessage("Password is too short"),

    body("phone")
      .custom((value) => {
        if (!value && value.trime().length < 10) {
          throw new Error("invalid phone number");
        }
        return true;
      })
      .withMessage("invalid phone number"),
    body("address")
      .custom((value) => {
        if (!value) {
          throw new Error("address field is required");
        }
        return true;
      })
      .withMessage("address field is required"),
    body("role")
      .custom((value) => {
        if (!value) {
          throw new Error("role is required");
        }
        return true;
      })
      .withMessage("role is required"),
  ],
  createUser
);
router.post(
  "/login",
  [
    body("email")
      .custom((value) => {
        if (!value) {
          throw new Error("email field is empty");
        }
        return true;
      })
      .withMessage("email field is required"),
    body("password").custom((value) => {
      if (!value) {
        throw new Error("password is required");
      }
    }),
  ],
  loginUser
);
router.get("/getData", authentication, cacheMiddlWare, setCahe, getuserData);
router.get("/fetchalldoctors", authentication, fetchAllDoctors);
router.post(
  "/makeappointment/:id",
  authentication,
  (req, res, next) => {
    req.isBookingAppointment = true;
    next();
  },
  BookAppointment
);
router.post("/cancleappointment/:id", authentication, CancleAppointment);
router.get("/history", authentication, History);
router.post(
  "/makeappointment_manually/:id",
  authentication,
  (req, res, next) => {
    req.isBookingAppointment = true;
    next();
  },
  BookAppointmentManually
);
router.get("/doctorDetail/:id", authentication, getDoctorDetails);
router.post("/logout", authentication, logout);
router.post("/forgotpass", authentication, forgotPass);
router.get("/refreshtoken", refreshAccessToken);
module.exports = router;
