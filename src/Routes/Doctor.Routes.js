const router = require("express").Router();
const {
  getDetailOfthePatient,
  loginDoctor,
  getDoctorData,
  setCriteria,
  manualUpdate,
} = require("../Controllers/Doctor.Controller");
const {
  createUser,
  loginUser,
  logout,
  forgotPass,
  refreshToken,
  refreshAccessToken,
} = require("../Controllers/Authentication.Controllers");
const {
  deoctorAuthentiaction,
  verifyAuthorityUser,
} = require("../Middleware/auth.Middleware");
const { body } = require("express-validator");
const upload = require("../Middleware/Multer.Middleware");

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
router.get(
  "/getDoctordata",
  deoctorAuthentiaction,
  verifyAuthorityUser,
  getDoctorData
);
router.post(
  "/getAllUser",
  deoctorAuthentiaction,
  verifyAuthorityUser,
  getDetailOfthePatient
);
router.post(
  "/setcriteria",
  [
    body("HowManyPatients")
      .custom((value) => {
        if (!value && value.length === 0) {
          throw new Error("filed cannot be empty or null");
        }
      })
      .withMessage("filed cannot be empty or null"),
    body("day")
      .custom((value) => {
        if (!value) {
          throw new Error("field is required");
        }
      })
      .withMessage("field is required"),

    body("start")
      .custom((value) => {
        if (!value) {
          throw new Error("field is required");
        }
      })
      .withMessage("field is required"),

    body("end")
      .custom((value) => {
        if (!value) {
          throw new Error("field is required");
        }
      })
      .withMessage("field is required"),
  ],
  deoctorAuthentiaction,
  verifyAuthorityUser,
  setCriteria
);
router.post(
  "/updatemanually",
  deoctorAuthentiaction,
  verifyAuthorityUser,
  manualUpdate
);
router.post("/logout", deoctorAuthentiaction, logout);
router.post("/forgotpass", deoctorAuthentiaction, forgotPass);

router.get("/refreshtoken", refreshAccessToken);
module.exports = router;
