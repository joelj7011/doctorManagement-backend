const { client } = require("../../Constants");
const { asyncHandler } = require("../Utils/AsyncHandler.Utiles");
const { decrypt } = require("../Utils/encryptioDecription.Utils");
const { getLineNumber } = require("../Utils/ErrorAtLine");
const { encrypt } = require("../Utils/encryptioDecription.Utils");

exports.cacheMiddlWare = asyncHandler(async (req, res, next) => {
  console.log("caching Middleware started........");
  if (!req.user?.id) {
    return res.status(400).json({
      error: "could not retrive the userid from Authenticaton middleware at ;",
      __filename,
    });
  } else {
    console.log("test1->passed");
  }
  try {
    const data = await client.get(`user:${req.user.id}`);
    if (data !== null) {
      try {
        const parseDate = JSON.parse(data);
        if (!parseDate) {
          return res.status(403).json({
            error: "could not parse the data at:",
            details: { location: __filename, lLine: getLineNumber() },
          });
        } else {
          console.log("test2->passed");
        }

        const decryptedDate = decrypt(
          parseDate?.encryptedData,
          parseDate?.iv,
          res
        );
        if (!decryptedDate) {
          return res.status(403).json({
            error: "could not decrypt  the data  at :",
            details: { location: __filename, lLine: getLineNumber() },
          });
        } else {
          return res.status(200).json(JSON.parse(decryptedDate));
        }
      } catch (decryptErr) {
        return res.status(500).json({
          error: `Decryption failed: ${decryptErr.message}`,
          details: { location: __filename, lLine: getLineNumber() },
        });
      }
    } else {
      console.log("Cache miss");
      next();
    }
    console.log("caching Middleware ended........");
  } catch (error) {
    return res.status(500).json({
      error: `Internal server error: ${error.message} at:`,
      __filename,
    });
  }
});

exports.setCahe = asyncHandler(async (req, res, next) => {
  console.log("setting cache.....");
  const data = req.user;
  const { iv, encryptedData } = await encrypt(JSON.stringify(data), res);

  if (!iv && encryptedData) {
    console.log("Encryption failed");
    return res.status(500).json({
      error: "Could not encrypt the data at:",
      details: { location: __filename, lLine: getLineNumber() },
    });
  } else {
    console.log("test1->passed");
  }

  const cacheData = await client.setEx(
    `user:${req.user.id}`,
    process.env.REDIS_CACHE_EXPIRY,
    JSON.stringify({
      iv,
      encryptedData,
    })
  );
  if (!cacheData) {
    console.log("Data could not be cached");
    return res.status(500).json({
      error: "Data could not be cached",
      details: { location: __filename, lLine: getLineNumber() },
    });
  } else {
    console.log("test2->passed");
  }
  next();
  console.log("caching done.....");
});
