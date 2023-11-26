const Nursery = require("../models/nursery");
const Product = require("../models/product");
const Sku = require("../models/sku");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Order = require("../models/order");
const SellerOrder = require("../models/sellerorder");

// const trackUser = [];

// exports.trackUserOrder = (userDetails)=>{
//     trackUser.push(userDetails);
//     if(userDetails){

//         createSellerOrder();
//     }
// }

exports.signup = async (req, res, next) => {
  try {
    const { name, phone, password, address, contactPerson } = req.body;

    const existingNursery = await Nursery.findOne({ phone: phone });
    if (existingNursery) {
      return res.status(400).json({
        message: "Nursery already exists",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    //   const nursery = new Nursery({
    //     name : name,
    //     phone: phone,
    //     password: hashedPassword,
    //     address: address
    //   })
    //   await nursery.save();

    await Nursery.create({
      name: name,
      phone: phone,
      password: hashedPassword,
      address: address,
      contactPerson: contactPerson,
    });
    res.status(200).json({
      message: "Nursery created successfully",
      nursery: { name, phone, address },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    var nursery = await Nursery.findOne({ phone: phone });

    if (!nursery) {
      res.status(401).send("Nursery doesn't exists");
    }

    const matchedPassword = await bcrypt.compare(password, nursery.password);
    if (matchedPassword) {
      const payload = {
        phone: nursery.phone,
        id: nursery._id,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });
      console.log(process.env.JWT_SECRET);
      const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };

      res.cookie("token", token, options).status(200).json({
        success: true,
        token,
        nursery,
        message: `User Login Success`,
      });
    } else {
      return res.status(401).json({
        message: "Invalid Credentials",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAllNursery = async (req, res, next) => {
  try {
    const nursery = await Nursery.find({});

    if (!nursery) {
      return res.status(404).json({
        message: "Nursery not found",
        success: false,
      });
    }
    const totalNursery = nursery.length;
    return res.status(200).json({
      success: true,
      nursery: nursery,
      totalNursery: totalNursery,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

exports.getNursery = async (req, res, next) => {
  try {
    const nurseryId = req.params.id;

    const nursery = await Nursery.findOne({ _id: nurseryId });
    try {
      if (!nursery) {
        return res.status(404).json({
          message: "Not found",
          success: false,
        });
      }

      res.status(200).json({
        success: true,
        nursery: nursery,
      });
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
};

exports.updateNursery = async (req, res, next) => {
  try {
    const nurseryId = req.params.id;
    const existingNursery = await Nursery.findById(nurseryId);
    if (!existingNursery) {
      return res.status(404).json({
        message: "Nursery not found",
        success: false,
      });
    }

    const update = {
      name: req.body.name,
      phone: req.body.phone,
      address: req.body.address,
      contactPerson: req.body.contactPerson,
    };

    const nursery = await Nursery.findByIdAndUpdate(
      { _id: nurseryId },
      update,
      { new: true }
    );

    res.status(200).json({
      message: "Updated",
      success: true,
      nursery: nursery,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};
exports.createProduct = async (req, res, next) => {
  try {
    //take parameters from the req body
    const {
      productType,
      name,
      startPrice,
      description,
      imageURL,
      category,
      status,
      sku,
    } = req.body;
    console.log("request ===", req.body);

    //check if the existing item is already added
    // const existingPlant = await Plant.findOne({name: name});
    // if(existingPlant){
    //     return res.status(409).json({message:`${name} plant exists`})
    // }
    const nurseryId = req.nursery.id;
    const nursery = await Nursery.findById(nurseryId);
    console.log("nurseryID ===", nurseryId);
    const product = new Product({
      type: productType,
      name: name,
      startPrice: startPrice,
      description: description,
      imageURL: imageURL,
      category: category,
      status: status, //this should be updated in the product schema,
      nurseryId: nurseryId,
    });
    //this state will be checked at the admin to approve or reject it.
    await product.save();
    await nursery.addPlants();
    for (let i in sku) {
      let s = new Sku();
      s.productId = prod.id;
      s.price = sku[i].price;
      s.colour = sku[i].colour;
      s.size = sku[i].size;
      s.availableIn = sku[i].availableIn;
      await s.save();
    }
    return res.status(200).json({
      message: "product is added",
    });
  } catch (error) {
    console.log(error);
    return res.status().json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

exports.updatePlant = async (req, res, next) => {
  try {
    //take parameters from the req body
    const plantId = req.params.id;

    const {
      productType,
      name,
      startPrice,
      description,
      imageURL,
      category,
      status,
      sku,
      productId,
    } = req.body;

    const existingPlant = await Plant.findOne({ _id: plantId });
    if (!existingPlant) {
      return res.status(404).json({
        message: "Plant not found",
      });
    } else {
      //plant already exists
      //   const update = new Plant({
      //     id: plantId,
      //     name: name,
      //     price: price,
      //     description: description,
      //     imageURL: imageURL,
      //     category: category,
      //     size: size,
      //     availableIn: availableIn,
      //   });

      //   const plant = await Plant.findOneAndUpdate({ _id: plantId }, update, {
      //     new: true,
      //   });
      var prod = await Product.findById(productId);
      const nurseryId = req.nursery.id;
      const nursery = await Nursery.findById(nurseryId);
      console.log("nurseryID ===", nurseryId);
      prod.name = name;
      prod.startPrice = startPrice;
      prod.description = description;
      prod.imageUrl = imageURL;
      prod.category = category;
      prod.status = status; //this should be updated in the product schema,
      //this state will be checked at the admin to approve or reject it.
      await prod.save();
      await nursery.addPlants();
      for (let i in sku) {
        let s = new Sku();
        s.productId = prod.id;
        s.price = sku[i].price;
        s.colour = sku[i].colour;
        s.size = sku[i].size;
        s.availableIn = sku[i].availableIn;
        await s.save();
      }

      res.status(200).json({
        message: "Updated successfully",
        success: true,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status().json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

exports.deletePlant = async (req, res, next) => {
  try {
    const prodId = req.params.productId;
    if (!plantId) {
      return res.status(404).json({
        message: `PlantId ${plantId} doesn't exists`,
        success: false,
      });
    }
    var prod = await Product.findById(prodId);
    await prod.deleteOne({ _id: prodId });
    return res.status(200).json({
      message: "Plant is deleted",
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status().json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

exports.trackUserOrder = async (userDetails) => {
  try {
    console.log("userDetails", userDetails);

    if (userDetails) {
      const trackUser = await SellerOrder.create({
        userOrderId: userDetails.orderId,
        products: userDetails.products,
        nurseryId: userDetails.nurseryId,
        totalPrice: userDetails.totalPrice,
        orderStatus: "placed",
      });

      console.log("seller order has been created ==", trackUser);
    } else {
      throw new Error("No Details found");
    }
  } catch (err) {
    console.log(err);
  }
};
// exports.getOrderByNurseryId = async (req, res, next) =>{
//     try{
//         const nurseryId = req.params.id;
//             const orders = await Order.find({});
//             console.log("orders === " , orders);
//             const filter = orders.map(order => order.products.some(product => product.product.equals(ObjectId(nurseryId))));
//             console.log('map the order ==', orders.map(order => order.products));
//             // console.log('map nurserId')
//             console.log(filter);
//             res.status(200).json({
//                 order:filter
//             })
//     }
//     catch(error){
//         console.error(error);
//         return res.status(500).json({
//             message:"Internal server error"
//         })
//     }
// }

exports.fetchSellerOrder = async (req, res, next) => {
  try {
    //
    const nurseryId = req.params.id;
    const userOrder = await SellerOrder.find({ nurseryId: nurseryId }).populate(
      {
        path: "products",
        populate: {
          path: "plantId",
          model: "Plant", // Use the name of your Plant model
        },
      }
    );
    console.log("userOrder ===== ", userOrder);

    res.status(200).json({
      message: "Fetched",
      userOrder: userOrder,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Error while fetching seller order",
      success: false,
      err: err.message,
    });
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const newOrderStatus = req.body.status;
    const updatedOrder = await SellerOrder.findOneAndUpdate(
      { userOrderId: orderId },
      { orderStatus: newOrderStatus },
      { new: true }
    );
    if (!updatedOrder) {
      return res.status(404).json({ message: "Seller order not found" });
    }

    res.status(200).json({
      message: "status updated",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};
