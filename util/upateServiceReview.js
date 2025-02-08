const Product = require("../models/product");
const Package = require("../models/packages");
const Review = require("../models/review");
const mongoose = require("mongoose");

const updateServiceRating = async (serviceId, serviceType) => {
  try {
    const Model = serviceType === "product" ? Product : Package;

    const stats = await Review.aggregate([
      {
        $match: {
          [serviceType === "product" ? "productId" : "packageId"]:
            new mongoose.Types.ObjectId(serviceId),
          reviewType: "ON-BOOKING",
          status: "APPROVED",
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          ratingCounts: { $push: "$rating" },
        },
      },
    ]);

    const ratingData =
      stats.length > 0
        ? {
            rating: parseFloat(stats[0].averageRating.toFixed(1)),
            totalReviews: stats[0].totalReviews,
            ratingDistribution: {
              5: stats[0].ratingCounts.filter((r) => r === 5).length,
              4: stats[0].ratingCounts.filter((r) => r === 4).length,
              3: stats[0].ratingCounts.filter((r) => r === 3).length,
              2: stats[0].ratingCounts.filter((r) => r === 2).length,
              1: stats[0].ratingCounts.filter((r) => r === 1).length,
            },
          }
        : {
            rating: 0,
            totalReviews: 0,
            ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          };

    await Model.findByIdAndUpdate(serviceId, {
      $set: {
        rating: ratingData.rating,
        totalReviews: ratingData.totalReviews,
        ratingDistribution: ratingData.ratingDistribution,
      },
    });

    return ratingData;
  } catch (error) {
    console.error("Error updating service rating:", error);
    throw error;
  }
};

module.exports = updateServiceRating;
