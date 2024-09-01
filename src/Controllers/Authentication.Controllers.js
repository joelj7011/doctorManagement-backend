const jwt = require("jsonwebtoken");
const Doctor = require("../Models/Doctor.Model");
const User = require("../Models/User.Model");
const { asyncHandler } = require("../Utils/AsyncHandler.Utiles");
const ApiResponse = require("../Utils/Apiresponse.utils");
const { GenerateTokens } = require("../Utils/SendToken.utils");
const { options } = require("../../Constants");
const { getLineNumber } = require("../Utils/ErrorAtLine");
const { comparePassword } = require("../Utils/Auth.Utils");

exports.createUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address, role } = req.body;

  if (name && email && password && phone && address && role) {
    console.log("test1-passed");
  } else {
    console.log("test1-failed");
    return res.status(401), json({ error: "all fields are required" });
  }

  let user;
  if (role === "doctor") {
    user = await Doctor.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      phone: req.body.phone,
      profileImage: req.file.filename,
      address: req.body.address,
      role: req.body.role,
    });
  } else {
    user = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      phone: req.body.phone,
      address: req.body.address,
      role: req.body.role,
    });
  }

  if (user) {
    console.log("test2->passed");
  } else {
    console.log("test2->failed");
    return res.status(403).json({
      error: `could not create the user error at ${__filename} at line ${getLineNumber()}`,
    });
  }

  const hashData = await user?.hashPassword(user.password);
  console.log("->", hashData);
  if (hashData) {
    return res.status(200).json(new ApiResponse(200, hashData, "user created"));
  } else {
    return res.status(403).json({ error: "user could not be created" });
  }
});

exports.loginUser = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;
  console.log(email, password, role);
  if (email && password && role) {
    console.log("test1-passed");
  } else {
    console.log("test1-failed");
    return res.status(401).json({ error: "all fields are required" });
  }

  let user;
  let passwordCompare;

  if (role === "doctor") {
    user = await Doctor.findOne({ email: email });
    if (user) {
      console.log("test2-passed");
    } else {
      console.log("test2-failed");
      return res.status(403).json({ error: "doctor email not found" });
    }

    passwordCompare = await user?.comparePassword(password);
    if (passwordCompare) {
      console.log("test3-passed");
    } else {
      console.log("test3-failed");
      return res.status(400).json({ error: "patient email not found" });
    }
  } else {
    user = await User.findOne({ email: email });
    console.log(user)
    if (user) {
      console.log("test2-passed");
    } else {
      console.log("test2-failed");
      return res.status(403).json({ message: `email was not found` });
    }

    passwordCompare = await user?.comparePassword(password);
    if (passwordCompare) {
      console.log("test3-passed");
    } else {
      console.log("test3-failed");
      return res
        .status(400)
        .json({ message: "please login with correct credentials" });
    }
  }
  console.log(user.id);

  const { accessToken, refreshToken } = await GenerateTokens(user);
  if (accessToken && refreshToken) {
    console.log("test4-passed");
  } else {
    console.log("test4-failed");
  }

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { data: user, accessToken, refreshToken },
        "user logged in"
      )
    );
});

// exports.asyncHandler(async (req, res) => {

//     const refreshToken = req.cookies?.refreshToken;
//     if (!refreshToken) {
//         throw new ApiError(403, " refreshToken not found");
//     } else {
//         const decode = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
//         if (!decode) {
//             throw new ApiError(403, "could not decode");
//         }
//         const data = decode?.role === 'doctor' ? await Doctor?.findById(decode?.id) : await User?.findById(decode?.id);
//         if (!data) {
//             throw new ApiError(400, "could not find the user");
//         }
//         const { accessToken, refreshToken } = await GenerateTokens(data?.id);
//         if (!accessToken && !refreshToken) {
//             throw new ApiError(400, "accessToken & refreshToken could not be destrucutred");
//         }
//         const filterd = filterdetail(data);
//         if (!filterd) {
//             throw new ApiError(400, "could not filter the data ");
//         }
//         return res.status(200).cookie('accessToken', accessToken, options).cookie('refreshToken', refreshToken, options).json(new ApiResponse(200, { data: filterd, accessToken, refreshToken }, "user logged in"));
//     }
// })

exports.forgotPass = asyncHandler(async (req, res) => {
  const { oldpass, newpass } = req.body;
  if (!oldpass && !newpass) {
    if (oldpass === newpass) {
      return re.status(500).json({ errro: "select a new password" });
    }
    return res.status(401).json({ error: "All fields are required" });
  }

  let user;
  if (req.user.role === "patient") {
    user = await User.findById(req.user.id);
    if (!user) {
      return res.status(403).json({ error: "could not find the user" });
    } else {
      console.log("test2->passed");
    }
  } else {
    user = await User.findById(req.doctor.id);
    if (!user) {
      return res.status(403).json({ error: "could not find the user" });
    } else {
      console.log("test2->passed");
    }
  }

  const copare_old_password = await user?.comparePassword(oldpass);
  if (copare_old_password) {
    console.log("test3->passed");
  } else {
    return res
      .status(500)
      .json({ error: "you enterd the old password choose a new one" });
  }

  const hash_password = await user?.hashPassword(newpass);
  if (hash_password) {
    console.log("test4->passed");
  } else {
    return res.status(500).json({ error: "new pass could not be hashed" });
  }

  const { accessToken, refreshToken } = await GenerateTokens(user);
  if (accessToken && refreshToken) {
    console.log("test4-passed");
  } else {
    console.log("test4-failed");
  }

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { data: user, accessToken, refreshToken },
        "user logged in"
      )
    );
});

exports.deleteAccount = asyncHandler(async (req, res) => {});
