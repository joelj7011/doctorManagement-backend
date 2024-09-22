const Notification = require("../Models/Notification.Model");
const User = require("../Models/User.Model");
const ApiResponse = require("../Utils/Apiresponse.utils");
const { asyncHandler } = require("../Utils/AsyncHandler.Utiles");
const { validation } = require("../Utils/VerfiyAuthority");

exports.GetNotification = asyncHandler(async (req, res) => {
  const user_data = await validation(req, res);
  console.log(user_data);
  if (user_data) {
    console.log("test1->passed");
  } else {
    console.log("test1->failed");
    return res.status(403).json({ error: "could not be found" });
  }

  let user;
  user = await Notification.find(
    user_data.role === "patient"
      ? { "reciver.type": req?.user?.id }
      : { "reciver.type": req?.doctor?.id }
  );

  if (user && user?.length > 0) {
    console.log("test1->passed");
    return res.status(200).json(new ApiResponse(200, user, "data fetched"));
  } else {
    console.log("test1->failed");
    return res.status(403).json({ error: "could  not find the notifiction" });
  }
});
