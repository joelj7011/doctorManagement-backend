const Doctor = require("../Models/Doctor.Model");
const User = require("../Models/User.Model");

exports.GenerateTokens = async (user) => {
    try {
        const data = user.role === 'patient' ?
            await User.findById(user.id)
            : await Doctor.findById(user.id)

        const accessToken = await data?.generateAccessToken();
        if (accessToken) {
            console.log("test2-passed");
        } else {
            console.log("test2-failed");
        }
        const refreshToken = await data?.generateRefreshToken();
        if (refreshToken) {
            console.log("test3-passed");
        } else {
            console.log("test3-failed");
        }

        data.refreshToken = refreshToken;
        if (data.refreshToken) {
            console.log("test4-passed");
        } else {
            console.log("test4-failed");
        }
        await data.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };

    } catch (error) {
        console.log(error);
    }

};