const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.hashPassword = async function (password) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    this.password = hash;
    return this.save();
};

exports.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
}

exports.generateAccessToken = async function () {
    return jwt.sign({
        id: this.id,
        name: this.name,
        email: this.email,
        role: this.role,
    }, process.env.GENERATE_TOKEN_SECRET, { expiresIn: process.env.GENERATE_TOKEN_EXPIERY });
};

exports.generateRefreshToken = async function () {
    return jwt.sign({
        id: this.id
    }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIERY });
};
