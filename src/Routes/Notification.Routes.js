const router = require("express").Router();
const { GetNotification } = require("../Controllers/Notification.Controllers");
const { authentication } = require("../Middleware/auth.Middleware");

router.get("/getNotification", authentication, GetNotification);

module.exports = router;