const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (cb) {
        cb(null, path.join(__dirname, "../../public/temp"));
    },
    filename: function (file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

module.exports = upload;
