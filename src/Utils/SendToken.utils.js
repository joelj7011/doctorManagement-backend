const Doctor = require("../Models/Doctor.Model");
const User = require("../Models/User.Model");
const { message } = require("./VerfiyAuthority");

exports.GenerateTokens = async (user) => {
  console.log("|");
  console.log("|generating tokens....|");
  try {
    console.log("user->", user);
    const response = {
      message: "",
      success: false,
    };
    const data =
      user.role === "patient"
        ? await User.findById(user.id)
        : await Doctor.findById(user.id);

    const accessToken = await data?.generateAccessToken();
    if (accessToken) {
      console.log("test2-passed");
    } else {
      console.log("test2-failed");
      return (response = {
        message: "could not generate the access token at sendToken.js",
        success: false,
      });
    }
    const refreshToken = await data?.generateRefreshToken();
    if (refreshToken) {
      console.log("test3-passed");
    } else {
      console.log("test3-failed");
      return (response = {
        message: "could not generate the refreshToken token at sendToken.js",
        success: false,
      });
    }

    data.refreshToken = refreshToken;
    if (data.refreshToken) {
      console.log("test4-passed");
    } else {
      return (response = {
        message: "could not save the refreshToken at sendToken.js",
        success: false,
      });
    }
    await data.save({ validateBeforeSave: false });
    console.log("|generating tokens ends....|");
    console.log("|");

    return { accessToken, refreshToken };
  } catch (error) {
    console.log(error);
  }
};
