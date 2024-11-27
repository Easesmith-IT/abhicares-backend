const mongoose=require('mongoose')

const counterModel = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true 
}, 
  value: { 
    type: Number, 
    required: true 
 }, 
});

const counterSchema=mongoose.model('counterSchema',counterModel)
module.exports={counterSchema}
