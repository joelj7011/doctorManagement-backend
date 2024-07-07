const ApiError = require("../Utils/Apierror.Utils");
const jwt = require("jsonwebtoken");
const Doctor = require("../Models/Doctor.Model");
const User = require("../Models/User.Model");


exports.asyncHandler(async (req, res) => {

    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
        throw new ApiError(403, " refreshToken not found");
    } else {
        const decode = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        if (!decode) {
            throw new ApiError(403, "could not decode");
        }
        const data = decode?.role === 'doctor' ? await Doctor?.findById(decode?.id) : await User?.findById(decode?.id);
        if (!data) {
            throw new ApiError(400, "could not find the user");
        }
        const { accessToken, refreshToken } = await GenerateTokens(data?.id);
        if (!accessToken && !refreshToken) {
            throw new ApiError(400, "accessToken & refreshToken could not be destrucutred");
        }
        const filterd = filterdetail(data);
        if (!filterd) {
            throw new ApiError(400, "could not filter the data ");
        }
        return res.status(200).cookie('accessToken', accessToken, options).cookie('refreshToken', refreshToken, options).json(new ApiResponse(200, { data: filterd, accessToken, refreshToken }, "user logged in"));
    }
})