const User = require("../Models/User.Model");
const ApiError = require("../Utils/Apierror.Utils");
const { asyncHandler } = require("../Utils/AsyncHandler.Utiles");
const ApiResponse = require("../Utils/Apiresponse.utils");
const Review = require("../Models/Review.Models");
const { default: mongoose } = require("mongoose");


exports.addReview = asyncHandler(async (req, res) => {

    const { content } = req.body;
    if (!content || content.trim() === "") {
        console.log("test1->failed");
        throw new ApiError(404, 'Add a review please');
    } else {
        console.log("test1->passed");
    }

    const userId = new mongoose.Types.ObjectId(req.user._id);
    const doctorId = new mongoose.Types.ObjectId(req.params.id);

    const pipeline = await User.aggregate([
        {
            $match: {
                _id: userId
            }
        },
        {
            $lookup: {
                from: 'doctors',
                localField: 'history',
                foreignField: '_id',
                as: 'doctordetail'
            }
        },
        {
            $addFields: {
                doctor: {
                    $arrayElemAt: [
                        {
                            $filter: {
                                input: "$doctordetail",
                                as: "doc",
                                cond: { $eq: ["$$doc._id", doctorId] }
                            }
                        },
                        0
                    ]
                }
            }
        },
        {
            $addFields: {
                doctorExists: {
                    $cond: { if: { $gt: [{ $size: "$doctordetail" }, 0] }, then: true, else: false }
                }
            }
        },
        {
            $match: {
                doctorExists: true
            }
        },
        {
            $lookup: {
                from: 'reviews',
                localField: "_id",
                foreignField: "patient",
                as: 'existingReview'
            }
        },
        {
            $unwind: {
                path: "$existingReview",
            }
        },
        {
            $match: {
                "existingReview.doctor": doctorId
            }
        },
        {
            $project: {
                doctor: 1,
                existingReview: 1
            }
        }
    ]);
    if (!pipeline[0].doctor) {
        throw new ApiError(403, "no doctor found")
    }
    else if (pipeline[0]?.existingReview?.length === 0) {
        const newReview = await Review.create({
            content: content,
            patient: userId,
            doctor: doctorId
        });
        return res.status(200).json(new ApiResponse(200, newReview, "Review added"));
    } else {
        const condition = {
            patient: req.user?.id, doctor: req.params?.id
        }
        const review = await Review.findOneAndUpdate(condition,
            {
                $set: { content: content }

            },
            { new: true, useFindAndModify: false }
        );
        if (review) {
            return res.status(200).json(new ApiResponse(200, review, "review updated"))
        } else {
            throw new ApiError(403, "no review found");
        }
    }

});
exports.deleteReview = asyncHandler(async (req, res) => {
});