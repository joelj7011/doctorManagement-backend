const crypto = require('crypto');
const ApiError = require('./Apierror.Utils');
const { sensitiveHeaders } = require('http2');
const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

exports.encrypt = async (data) => {
    try {
        console.log("encryption started.......");
        const cipher = crypto = crypto.createCipheriv(algorithm, key, iv);
        if (!crypto) {
            throw new ApiError(400, "could not create cipher:", __filename);
        }
        let encrypted = cipher.update(data, 'utf-8', 'hex');
        if (!encrypted) {
            throw new ApiError(400, "could not enctypt:", __filename)
        }
        encrypted = encrypted + cipher.final('hex');
        if (!encrypted) {
            throw new ApiError(400, "could process the finalization");
        }
        const Sensativedata = { iv: iv.toString('hex'), encrypredDate: encrypted };
        if (!Sensativedata) {
            throw new ApiError(400, "could not create the sensitivedata");
        }
        console.log("encryption ended.......");
        return Sensativedata;
    } catch (error) {
        throw new ApiError(403, `error occured:${error} at:`, __filename);
    }

};
exports.decrypt = (data) => {
    try {
        console.log("decryption started.......");
        const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
        if (!decipher) {
            throw new ApiError(400, "could not create decipher at :", __filename);
        }
        let decrypted = decipher.update(data, 'hex', 'utf-8');
        if (!decrypted) {
            throw new ApiError(400, "could not decrypt:", __filename)
        }
        decrypted = decrypted + decipher.final('utf8');
        if (!decrypted) {
            throw new ApiError(400, "could process the finalization at:", __filename);
        }
        console.log("decryption ended.......");
        return decrypted;
    } catch (error) {
        throw new ApiError(403, `error occured:${error} at:`, __filename);
    }

};
