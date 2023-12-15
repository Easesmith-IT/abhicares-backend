const Razorpay = require("razorpay");
var crypto = require("crypto");
const mongoose = require("mongoose");
// const { configDotenv } = require("dotenv");
const { configDotenv } = require("dotenv");
configDotenv({ path: "../config/config.env" });
const fs = require("fs");
const AppError = require("../controllers/errorController");

//Importing Models
const UserAddress = require("../models/useraddress");
const User = require("../models/user");
const Order = require("../models/order");
const Payment = require("../models/payments");
const Products = require("../models/product");
const Cart = require("../models/cart");
const Booking = require("../models/booking");
// const { trackUserOrder } = require("../controllers/nursery");
const {
  getInvoiceData,
  getCurrentDate,
  getDeliveryDate,
} = require("../util/invoiceData");
const easyinvoice = require("easyinvoice");
const order = require("../models/order");
// test credentials
const razorPayKeyId = "rzp_test_XtC1VoPYosmoCP";
const razorKeySecret = "olIq40GreBPUaEz80552bG2f";

///
const instance = new Razorpay({
  key_id: razorPayKeyId,
  key_secret: razorKeySecret,
});

exports.websiteCodOrder = async (req, res, next) => {
  try {
    const userAddressId = req.body.userAddressId;
    const user = req.user;
    const bookings = req.body.bookings;
    const couponId= req.body.couponId;
    const cart = await Cart.findOne({ userId: user._id }).populate("items"); // Populate the 'cart' field
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    const items = cart.items;
    // Create an array to store order items
    const orderItems = [];
    //     // Process and add plant items to the order
    for (const productItem of items) {
      const prod = await Products.findById(productItem.productId);
      if (prod) {
        var bookingItem = bookings.find((bookItem) => {
          return bookItem.productId == prod._id;
        });
        orderItems.push({
          product: prod,
          quantity: productItem.quantity,
          bookingTime: bookingItem.bookingTime,
          bookingDate: bookingItem.bookingDate,
        });
      }
    }
    const userAddress = await UserAddress.findById(userAddressId);
    const order = new Order({
      orderPlatform: "website",
      paymentType: "COD",
      orderValue: cart.totalPrice,
      products: orderItems,
      couponId:couponId,
      user: {
        userId: user._id,
        phone: user.phone,
        name: user.name,
        address: {
          addressLine: userAddress.addressLine,
          pincode: userAddress.pincode,
          landmark: userAddress.landmark,
        },
      },
    });
    //     // // Save the order to the database
    await order.save();
    ///booking creation
    for (const orderItem of orderItems) {
      console.log(orderItem);
      var booking = new Booking({
        order: order._id,
        userId: user._id,
        userAddress: {
          addressLine: userAddress.addressLine,
          pincode: userAddress.pincode,
          landmark: userAddress.landmark,
        },
        product: orderItem.product,
        quantity: orderItem.quantity,
        bookingDate: orderItem.bookingDate,
        bookingTime: orderItem.bookingTime,
        orderValue: orderItem.product.offerPrice * orderItem.quantity,
      });
      await booking.save();
    }
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();
    return res.status(200).json(order);
  } catch (err) {
    console.log(err);
    return { message: "error", error: err };
  }
};

exports.AppcodOrder = async (req, res, next) => {
  try {
    const userId = req.body.userId;
    const userAddressId = req.body.userAddressId;
    const user = await User.findById(userId);
    const cart = req.body.cart;
    // cart["products"].forEach((value, index, array) => {
    //   console.log(cart["products"][index]);
    // });
    console.log(req.body);
    // console.log(cart)
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Extract cart data from the user's cart
    const products = cart["products"];
    // // Create an array to store order items
    const orderItems = [];
    for (const productItem of products) {
      orderItems.push(productItem["prod"]);
    }
    console.log(orderItems);

    const userAddress = await UserAddress.findById(userAddressId);
    // Create a new order instance

    const order = new Order({
      paymentType: cart["paymentType"],
      orderValue: cart["totalAmount"],
      products: orderItems,
      orderPlatform: "app",
      user: {
        userId: user._id,
        phone: user.phone,
        name: user.name,
        address: {
          addressLine: userAddress.addressLine,
          pincode: userAddress.pincode,
          // mobile: userAddress.mobile,
          landmark: userAddress.landmark,
        },
      },
    });

    // // // Save the order to the database

    await order.save();
    return res.status(200).json(order);
    // const newNurseryIds = [
    //   ...new Set(orderItems.map((item) => item.product.nurseryId.toString())),
    // ];
    // console.log(
    //   "nurseryIds ==== ",
    //   newNurseryIds,
    //   "count -- ",
    //   newNurseryIds.length
    // );
    // const productItems = orderItems
    //   // .filter((item) => item.type === "Plant")
    //   .map((item) => ({
    //     type: item.type,
    //     product: item.product,
    //     quantity: item.quantity,
    //   }));

    // // console.log("productItems ====== ", productItems);

    // for (const id of newNurseryIds) {
    //   let productDetails = [];
    //   const orderedProduct = productItems.filter(
    //     (ele) => ele.product.nurseryId.toString() === id
    //   );
    //   console.log("orderedProduct === ", orderedProduct);
    //   const totalPrice = orderedProduct.reduce(
    //     (total, item) => total + item.product.price * item.quantity,
    //     0
    //   );
    //   // console.log("totalPrice ===== ", totalPrice);
    //   const newValue1 = orderedProduct.map((item) => ({
    //     type: item.type,
    //     plantId: item.product._id,
    //     quantity: item.quantity,
    //   }));
    //   // console.log(newValue1);
    //   productDetails = {
    //     orderId: order._id,
    //     products: newValue1,
    //     nurseryId: new mongoose.Types.ObjectId(id),
    //     totalPrice: totalPrice,
    //   };
    //   trackUserOrder(productDetails);
    //   console.log("seller order == ", productDetails);
    // }

    // // retrieving quantity price and name of he product

    // const pdf = await getUserInvoice(order);
    // // console.log(pdf)
    // // Clear the user's cart after creating the order
    // cart.items = [];
    // cart.totalValue = 0;
    // await cart.save();

    // return res.status(200).json({
    //   success: true,
    //   order: order,
    //   invoice: pdf,
    // });
  } catch (err) {
    console.log(err);
    return { message: "error", error: err };
  }
};

async function getUserInvoice(order) {
  try {
    const userInfo = {
      orderId: order._id.toString(),
      company: order.user.name,
      address: order.user.address.addressLine || "",
      pincode: order.user.address.pincode,
      city: order.user.address.city,
      products: order.products.map(({ product, quantity }) => ({
        quantity: `${quantity}`,
        description: `${product.name}`,
        price: `${product.price}`,
        "tax-rate": "2",
      })),
      currentDate: getCurrentDate(new Date()),
      deliveryDate: getDeliveryDate(),
      // logo: Buffer.from(logo, 'base64') // Uncomment this line if logo is available
    };

    console.log("userInfo in payment controller == ", userInfo);
    const data = getInvoiceData(userInfo);
    console.log("data ======== ", data);
    const result = await easyinvoice.createInvoice(data);
    const pdfData = Buffer.from(result.pdf, "base64");

    // Save the PDF to a file (optional)
    fs.writeFileSync("invoice.pdf", pdfData);
    return pdfData;
    // res.setHeader('Content-Type', 'application/pdf');
    // res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf');
    // res.send(result.pdf);
  } catch (err) {
    console.log(err);
    return err.message;
  }
}

exports.getAllUserOrders = async (req, res, next) => {
  try {
    const id = req.user._id;
      const result = await Order.find({ "user.userId": id });
      res
        .status(200)
        .json({ success: true, message: "Your all orders", data: result })
  } catch (err) {
    next(err);
  }
};

exports.createOrderInvoice=async(req,res,next)=>{
  try{
          const id=req.params.id
          const result=await Order.findOne({_id:id})
          res.status(200).json({success:true,message:"This is order details",data:result})
  }catch(err){
    next(err)
  }
}

exports.updateOrderStatus=async(req,res,next)=>{
  try{
        const id=req.params.id  // order id
        const status=req.body.status
        var result=await Order.findOne({_id:id})
        result.status= status        
        await result.save()
        res.status(200).json({success:true,message:"Order status changed successfull"})
  }catch(err){
    next(err)
  }
}

exports.getAllOrders= async (req, res, next) => {
  try {
    // let status="in-review"
    // if(req.body.status){
    //      status=req.body.status
    // }
  //  const {status}=req.body.status
    var page = 1
    if (req.query.page) {
      page = req.query.page
    }
    var limit = 10
    const allList = await Order.find().count()
    var num = allList / limit
    var fixedNum = num.toFixed()
    var totalPage = fixedNum
    if (num > fixedNum) {
      totalPage++
    }
    const result = await Order.find().populate({ 
      path: 'user',
      populate: {
        path: 'userId',
        model: 'User'
      } 
   }) .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec()
    res
      .status(201)
      .json({ success: true, message: 'List of all orders', data: result,totalPage:totalPage })
  } catch (err) {
    next(err)
  }
}