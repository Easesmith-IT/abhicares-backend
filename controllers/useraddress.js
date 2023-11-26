const UserAddress = require('../models/useraddress');
const mongoose = require('mongoose')
exports.addUserAddress = async (req, res) => {
    try {
        const {
            address_line1,
            address_line2,
            state,
            city,
            pincode,
            country,
            mobile,
        } = req.body;

        // const userId = req.query.userId;
        const userId = req.user.id;

        const address = {
            address_line1: address_line1,
            address_line2: address_line2,
            state: state,
            city: city,
            pincode: pincode,
            country: country,
            mobile: mobile,
        }

        const useraddress = await UserAddress.findOneAndUpdate(
            { userId: userId },
            { $push: { addresses: address } },
            { upsert: true, new: true }
        );

        if (!useraddress) {
            return res.status(400).json({
                message: "Could not create user address please try again!"
            })
        }

        res.status(200).json({
            message: "User address added successfully",
        })
    }
    catch (err) {
        return res.status(500).json({
            message: "Error while adding user address",
            error: err.message
        })
    }
}

exports.updateUserAddress = async (req, res) => {
    try {

        const addressId = req.params.id;
        // const userId = req.query.userId;
        const userId = req.user.id;
        const userAddress = await UserAddress.aggregate([
            {
                $unwind: { path: "$addresses" }
            },
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                    "addresses._id": new mongoose.Types.ObjectId(addressId)
                }
            },
        ]);
        if (userAddress.length == 0) {
            return res.status(404).json({
                message: "User address not found"
            })
        }


        const {
            address_line1,
            address_line2,
            country,
            state,
            city,
            pincode,
            mobile,
            defaultAddress
        } = req.body;

        const update = await UserAddress.findOneAndUpdate(
            {
                userId: userId,
                "addresses._id": addressId  // Use the _id of the address you want to update
            },
            {
                $set: {
                    "addresses.$.address_line1": address_line1,
                    "addresses.$.address_line2": address_line2,
                    "addresses.$.country": country,
                    "addresses.$.state": state,
                    "addresses.$.city": city,
                    "addresses.$.pincode": pincode,
                    "addresses.$.mobile": mobile,
                    "addresses.$.defaultAddress": defaultAddress
                }
            },
            { new: true }
        );

        if (!update) {
            return res.status(400).json({
                message: "Could not update user address"
            })
        }

        res.status(200).json({
            message: "updated successfully",
        })
    }
    catch (err) {
        return res.status(500).json({
            message: "Error while updating user address",
            error: err.message
        })
    }
}

exports.getAllAddresses = async (req, res) => {
    try {
        // const userId = req.query.userId;
        const userId = req.user.id;
        const addresses = await UserAddress.find({ userId: userId })

        if (!addresses) {
            return res.status(400).json({
                message: 'No Address found',
            })
        }

        res.status(200).json({
            addresses: addresses
        })
    }
    catch (err) {
        return res.status(500).json({
            message: "Error fetching addresses",
            error: err.message
        })
    }
}


exports.deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        // const userId = req.query.userId;
        const userId = req.user.id;
        const userAddress = await UserAddress.aggregate([
            {
                $unwind: { path: "$addresses" }
            },
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                    "addresses._id": new mongoose.Types.ObjectId(addressId)
                }
            },
        ]);
        if (userAddress.length == 0) {
            return res.status(404).json({
                message: "User address not found"
            })
        }

        const deleteUserAddress = await UserAddress.updateOne(
            {
                userId: new mongoose.Types.ObjectId(userId)
            },
            { $pull: { "addresses": { _id: new mongoose.Types.ObjectId(addressId) } } });

        if (!deleteUserAddress) {
            return res.status(400).json({
                message: "Failed to delete the address"
            })
        }

        res.status(200).json({
            message: "Address is deleted"
        })
    }
    catch (err) {
        return res.status(500).json({
            message: "Error deleting address",
            error: err.message
        })
    }
}