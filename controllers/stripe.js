const User = require("../models/user");
const Cart = require("../models/cart");
const Product = require("../models/product");
const Coupon = require("../models/coupon");
const stripe = require("stripe")(process.env.STRIPE_SECRET);

exports.createPaymentIntent = async (req, res) => {
  // console.log(req.body);
  const {couponApplied} = req.body;

  // later apply coupon
  // later calculate price


  // find the user
  const user = await User.findOne({email: req.user.email}).exec();
   // get the user cartTotal
   const {cartTotal,totalAfterDiscount} = await Cart.findOne({orderdBy: user._id}).exec();
  // console.log(cartTotal,user);
let finalAmount = 0;

if(couponApplied && totalAfterDiscount){
  finalAmount= totalAfterDiscount * 100;

}
else{
  finalAmount = cartTotal * 100;
}
// console.log(totalAfterDiscount);

// create payment intent with order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: finalAmount,
    currency: "usd",
  });


  res.send({
    clientSecret: paymentIntent.client_secret,
    cartTotal,
    totalAfterDiscount,
    payable: finalAmount,
  });
};
