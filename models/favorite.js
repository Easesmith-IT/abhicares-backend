const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    products:[{
        type: mongoose.Schema.Types.ObjectId,
        required:true,
        ref: 'Product'
    }],
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});


const model = new mongoose.model("Favorite", schema);

module.exports = model;