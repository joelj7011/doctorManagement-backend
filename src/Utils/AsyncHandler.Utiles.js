exports.asyncHandler = (requestHandler) => async (req, res, next) => {
    try {
        requestHandler(req, res, next);
    } catch (error) {
        return res.status(error.code || 500).json({
            success: false,
            message: error.message
        });
    }
}
