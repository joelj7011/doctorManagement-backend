const router = require('express').Router();
const { fetchAllDoctors, BookAppointment, CancleAppointment, createUser, login, getuserData, History } = require('../Controllers/Patient.Controller');
const { verifyAuthority, authentication } = require('../Middleware/auth.Middleware');
const { body } = require('express-validator');

router.post('/createuser', [
    body('name').custom((value) => {

        if (!value || value.trim().length <= 3) {
            throw new Error("Name is too short");
        }
        return true;

    }).withMessage("Name is too short"),

    body('email').isEmail().withMessage("Invalid email address"),

    body('password').isLength({ min: 5 }).withMessage("Password is too short"),

    body('phone').custom((value) => {
        if (!value && value.trime().length < 10) {
            throw new Error("invalid phone number");
        }
        return true;
    }).withMessage("invalid phone number"),
    body('address').custom((value) => {
        if (!value) {
            throw new Error("address field is required");
        }
        return true;
    }).withMessage("address field is required"),
    body('role').custom((value) => {
        if (!value) {
            throw new Error("role is required");
        }
        return true;
    }).withMessage("role is required")
], createUser);
router.get('/login', [
    body('email').custom((value) => {
        if (!value) {
            throw new Error("email field is empty");
        }
        return true;
    }).withMessage("email field is required"),
    body('password').custom((value) => {
        if (!value) {
            throw new Error("password is required");
        }
    })
], login);
router.get('/getData', authentication, getuserData);
router.get('/fetchalldoctors', authentication, verifyAuthority, fetchAllDoctors);
router.post('/makeappointment/:id', authentication, verifyAuthority, BookAppointment);
router.post('/cancleappointment/:id', authentication, verifyAuthority, CancleAppointment);
router.get('/history', authentication, verifyAuthority, History)
module.exports = router;
