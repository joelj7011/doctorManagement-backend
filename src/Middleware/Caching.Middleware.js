const ApiError = require("../Utils/Apierror.Utils");
const { decrypt } = require("../Utils/encryptioDecription.Utils");


exports.cacheMiddlWare = async (req, res, next) => {
    console.log("caching started........");
    if (!req.user?.id) {
        return res.status(400).json({ error: "could not retrive the userid from Authenticaton middleware at ;", __filename });
    }
    try {
        const data = await client.get(`user:${req.user.id}`);
        if (data !== null) {
            try {
                const parseDate = JSON.parse(data);
                if (!parseDate) {
                    return res.status(403).json({ error: "could not parse the data at:", __filename });
                }
                const decryptedDate = decrypt(parseDate?.Sensativedata?.encrypredDate, parseDate?.Sensativedata?.iv, process.env.REDIS_SECRET_KEY);
                if (!decryptedDate) {
                    return res.status(4003).json({ error: "could not decrypt  the data  at :", __filename });
                }
            } catch (decryptErr) {
                return res.status(500).json({ error: `Decryption failed: ${decryptErr.message}` });
            }
        } else {
            console.log('Cache miss');
            next();
        }
        console.log("caching ended........");
    } catch (error) {
        return res.status(500).json({ error: `Internal server error: ${error.message} at:`, __filename });
    }

}