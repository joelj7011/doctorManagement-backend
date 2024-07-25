const { client } = require("../../Constants");

exports.setCahe = async (data, req, res) => {
    try {
        const { iv, encrypredDate } = encrypt(JSON.stringify(data));
        if (!iv && !encrypredDate) {
            console.log("Encryption failed");
            return res.status(500).json({ error: "Could not encrypt the data" });
        }
        const cacheData = await client.setEx(`user:${data?._id}`, 3600, JSON.stringify({
            iv, encrypredDate
        }));
        if (!cacheData) {
            console.log("Data could not be cached");
            return res.status(500).json({ error: "Data could not be cached" });
        }
        return cacheData;
    } catch (error) {

    }
}