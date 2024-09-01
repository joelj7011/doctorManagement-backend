const mongoose = require("mongoose");
const {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
} = require("../Utils/Auth.Utils");

const DoctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: Number, required: true },
    profileImage: { type: String, required: true },
    address: { type: String, required: true },
    specialization: { type: String },
    Max: { type: Number },
    patientStatus: [
      {
        number: { type: Number, default: 0 },
      },
    ],
    role: { type: String, required: true },
    availability: [
      {
        day: { type: String, required: true },
        start: { type: String, required: true },
        end: { type: String, required: true },
        date: { type: String, required: true },
        laterNumber: { number: { type: Number, default: 0 } },
        available: { type: Boolean, default: false },
      },
    ],
    refreshToken: { type: String },
  },
  { timestamps: true }
);

DoctorSchema.pre("save", function (next) {
  this.availability.forEach((status) => {
    if (status.laterNumber.number < 0) {
      status.laterNumber.number = 0;
    }
  });
  next();
});

DoctorSchema.pre("findOneAndUpdate", function (next) {
  const filter = this.getFilter();
  const update = this.getUpdate();
  const options = this.getOptions();

  console.log("Filter:", filter);
  console.log("Update:", update);
  console.log("Options:", options);

  if (update.$set && update.$set.availability) {
    update.$set.availability.forEach((status) => {
      if (status.laterNumber.number < 0) {
        status.laterNumber.number = 0;
      }
    });
  }
  if (update.$inc && update.$inc["availability.0.laterNumber.number"] < 0) {
    update.$inc["availability.0.laterNumber.number"] = 0;
  }
  next();
});

DoctorSchema.methods.hashPassword = function (password) {
  return hashPassword.call(this, password);
};
DoctorSchema.methods.comparePassword = function (password) {
  return comparePassword.call(this, password);
};
DoctorSchema.methods.generateAccessToken = function () {
  return generateAccessToken.call(this);
};
DoctorSchema.methods.generateRefreshToken = function () {
  return generateRefreshToken.call(this);
};
const Doctor = mongoose.model("Doctor", DoctorSchema);
module.exports = Doctor;
