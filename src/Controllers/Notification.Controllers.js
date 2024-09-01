const User = require("../Models/User.Model");
const { asyncHandler } = require("../Utils/AsyncHandler.Utiles");
const { validation } = require("../Utils/VerfiyAuthority");

exports.GetNotification = asyncHandler(async (req, res) => {
  const user_data = await validation(req, res);
  if (user_data) {
    console.log("test1->passed");
  } else {
    console.log("test1->failed");
    return res.status(403).json({ error: "could not be found" });
  }

  
});
