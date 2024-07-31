const crypto = require('crypto');
const ApiError = require('./Apierror.Utils');
const { getLineNumber } = require('./ErrorAtLine');

const algorithm = 'aes-256-cbc';
const key = Buffer.from('this_is_a_32_character_long_key_', 'utf-8')

exports.encrypt = async (data, res) => {
    try {
        console.log("encryption started.......");
        const iv = crypto.randomBytes(16);
        if (!iv) {
            console.log("test1->failed");
            return res.status(403).Jaon({ error: "could not genearte a iv ", details: { location: __filename, alLine: getLineNumber() } });
        } else {
            console.log("test1->passed");
        }

        const cipher = crypto.createCipheriv(algorithm, key, iv);
        if (!cipher) {
            return res.status(400).json({ error: "could not create cipher:", details: { location: __filename, alLine: getLineNumber() } })
        } else {
            console.log("test2->passed");
        }

        let encrypted = cipher.update(data, 'utf-8', 'hex');
        if (!encrypted) {
            return res.status(400).json({ error: "could not encrypt:", details: { location: __filename, alLine: getLineNumber() } })
        } else {
            console.log("test3->passed");
        }

        encrypted += cipher.final('hex');
        if (!encrypted) {
            return res.status(400).json({ error: "could not process the finalization at :", details: { location: __filename, alLine: getLineNumber() } })
        } else {
            console.log("test4->passed");
        }

        const sensitiveData = { iv: iv.toString('hex'), encryptedData: encrypted };
        if (!sensitiveData) {
            return res.status(400).json({ error: "could not create the sensitiveData" })
        } else {
            console.log("encryption ended.......");
            return sensitiveData;
        }
    } catch (error) {
        return res.status(403).json({ error: `error occurred: ${error}`, details: { location: __filename, alLine: getLineNumber() } })
    }
};

exports.decrypt = (data, iv, res) => {
    try {
        console.log("decryption started.......");
        const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
        if (!decipher) {
            return res.status(400).json({ error: "could not create decipher at :", details: { location: __filename, alLine: getLineNumber() } })
        } else {
            console.log("test1->passed");
        }


        let decrypted = decipher.update(data, 'hex', 'utf-8');
        if (!decrypted) {
            return res.status(400).json({ error: "could not decrypt:", details: { location: __filename, alLine: getLineNumber() } })
        } else {
            console.log("test2->passed");
        }

        decrypted += decipher.final('utf8');
        if (!decrypted) {
            return res.status(400).json({ error: "could process the finalization", details: { location: __filename, alLine: getLineNumber() } });
        } else {
            console.log("decryption ended.......");
            return decrypted;
        }

    } catch (error) {
        return res.status(403).json({ error: "error occured", details: { location: __filename, alLine: getLineNumber() } })
    }

};
