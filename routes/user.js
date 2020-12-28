const express = require("express");
const router = express.Router();
const { authCheck } = require("../middlewares/auth");
const {userCart,getUserCart,emptyCart,saveAddress,
    applyCouponToUserCart,
    createOrder,
    orders,
    addToWishlist,
    removeFromWishlist,
    wishlist,
    createCashOrder,
    savePhone,

    

} = require('../controllers/user');
 


router.post('/user/cart', authCheck, userCart);

router.get('/user/cart', authCheck, getUserCart);

router.delete('/user/cart' ,authCheck, emptyCart );

router.post('/user/address', authCheck, saveAddress)

router.post('/user/phone', authCheck, savePhone)

// coupon

router.post('/user/cart/coupon', authCheck, applyCouponToUserCart)

router.post('/user/order',authCheck, createOrder ); // stripe
router.post('/user/cash-order',authCheck, createCashOrder ); // COD

router.get('/user/orders',authCheck, orders);

// wishlist

router.post('/user/wishlist',authCheck,addToWishlist);
router.get('/user/wishlist',authCheck, wishlist);
router.put('/user/wishlist/:productId',authCheck, removeFromWishlist )


// router.get("/user", (req, res) => {
//   res.json({
//     data: "hey you hit user API endpoint",
//   });
// });

module.exports = router;
