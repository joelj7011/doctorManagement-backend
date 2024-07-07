
const catchAsyncErrors = (error, req, res) => {

    console.log("error-caught")
    if (error.code === 11000) {

        return res.status(400).json(
            {
                success: false,
                message: `Duplicate ${Object.keys(error.keyValue)} Entered`,
            }
        );
    } else {
        return res.status(500).send(error.message);
    }

}
module.exports = catchAsyncErrors;