const redis = require('redis');

exports.DB_NAME = "DoctorManagment"

exports.options = {
    httpOnly: true,
    secure: false
};
exports.corsOptions = {
    origin: " http://localhost:3000",
    credentials: true,
};
exports.filterdetail = function (data) {
    if (Array.isArray(data) && data.length > 0) {
        return data.map((item) => {
            const { password, _id, numberOfPatients, createdAt, updatedAt, refreshToken, __v, ...userData } = item.toObject();
            return userData;
        });
    } else {
        console.log(data);
        const { password, _id, numberOfPatients, createdAt, updatedAt, refreshToken, __v, ...userData } = data.toObject();
        return userData;
    }
};
exports.convertToISOTime = function (time12h) {
    const [time, period] = time12h.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) {
        hours += 12;
    } else if (period === 'AM' && hours === 12) {
        hours = 0;
    }
    const date = new Date();
    date.setUTCHours(hours, minutes, 0, 0);
    console.log("->", date);
    const isoString = date.toISOString().slice(0, -1);
    console.log("->", isoString);
    return isoString;
};
exports.client = redis.createClient({
    url: 'redis://127.0.0.1:6379'
});
