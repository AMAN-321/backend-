const Product = require('../models/product');
const User = require('../models/user');
const slugify = require('slugify');


exports.create = async (req,res) => {
    try {
        console.log(req.body);
        req.body.slug = slugify(req.body.title);
        const newProduct = await new Product(req.body)
        .save();
        res.json(newProduct);

    } catch(err){
        console.log(err);
        // res.status(400).send('Create Product failed');
      res.status(400).json({
          err: err.message,
      });
    
    }

}

exports.listAll = async (req,res)=>{
    let products = await Product.find({})
    .limit(parseInt(req.params.count))
    .populate('category')
    .populate('subs')
    .sort([['createdAt', 'desc']])
    .exec();

    res.json(products);

};


exports.remove = async (req,res) =>{
    try{
        const deleted = await Product.findOneAndRemove
        ({slug: req.params.slug}).exec();
        res.json(deleted);


    } catch(err){
        console.log(err);
        return res.status(400).send('Product delete failed')

    }
}

exports.read = async(req,res) =>{
const product = await Product.findOne({slug: req.params.slug})
.populate('category')
.populate('subs')
.exec();
res.json(product);

}



exports.update = async (req,res) => {
    try {
        console.log(req.body);

        if(req.body.title){
            req.body.slug = slugify(req.body.title);
        }
        
        const updated = await  Product.findOneAndUpdate
        ({slug: req.params.slug},req.body,{
            new: true
        })
        .exec();
        res.json(updated);

    } catch(err){
        console.log(err);
        // res.status(400).send('Create Product failed');
        res.status(400).json({
            err: err.message,
        });
      
      };
    
    }
// This is without Pagination controll method
    // exports.list=async(req,res) =>{

    //     try{
    //         // sort will be createAt/updated
    //         // order will be desc/asc
    //         // limit will be 3/5/666
    //         const {sort,order,limit} = req.body;
    //         const products = await Product.find({})
    //         .populate('category')
    //         .populate('subs')
    //         .sort([[sort,order]])
    //         .limit(limit)
    //         .exec();

    //         res.json(products);


    //     }catch(err){
    //         console.log(err);

    //     }

    // }


// this is with pagination
    exports.list=async(req,res) =>{

        try{
            // sort will be createAt/updated
            // order will be desc/asc
            // limit will be 3/5/666
            const {sort,order,page} = req.body;
          const currentPage = page || 1;
          const perPage = 3;



            const products = await Product.find({})
            .skip((currentPage-1) * perPage )
            .populate('category')
            .populate('subs')
            .sort([[sort,order]])
            .limit(perPage)
            .exec();

            res.json(products);


        }catch(err){
            console.log(err);

        }

    }

    exports.productsCount = async (req,res)=>{
        let total = await
        // this give the total product number
         Product.find({}).estimatedDocumentCount().exec();
         res.json(total);
    }

    exports.productStar = async (req,res) =>{
        const product = await Product.findById(req.params.productId)
        .exec();
        const user = await User.findOne({email: req.user.email })
        .exec();
        const {star} = req.body;

        // who is updatinG?

        // check if currently logged in user have already added rating to this product

       let existingRatingObject = product.ratings.find
       ((ele)=>{
           return (ele.postedBy.toString() === user._id.toString());
       }) ;

       // if user havent left rating yet, push it
          if(existingRatingObject === undefined){
              let ratingAdded = await 
              Product.findByIdAndUpdate(product._id,{
                  $push: { ratings: {star: star, postedBy: user._id} }
              },{ new:true }).exec();
              console.log(ratingAdded);
              res.json(ratingAdded);
          }

          else{ // if user have already left a rating
             const ratingUpdated = await Product.updateOne(
                 {ratings: {$elemMatch: existingRatingObject } },
                 {$set:{'ratings.$.star': star }},{new:true}
             ).exec();
             console.log(ratingUpdated);
             res.json(ratingUpdated);

          }
      


    }

// $ne means not including that product
// '-password' mean every data without password in populate function second argument
    exports.listRelated = async (req,res)=>{
        const  product = await 
        Product.findById(req.params.productId).exec(); 
      const related = await Product.find({
          _id: {$ne: product._id},
          category: product.category,
      }).limit(3)
      .populate('category')
      .populate('subs')
      .populate('postedBy' ).exec();
     
      res.json(related);
  
  
    }


    const handleQuery = async (req,res,query)=>{
       const products = await 
       Product.find({$text: {$search:query } })
       .populate('category', '_id name')
       .populate('subs', '_id name')
       .populate('postedBy','_id name')
       .exec();

       res.json(products);


    }

    const handlePrice = async (req,res,price)=>{
     try {  
         let products = await
        Product.find ({
            price: {
                $gte: price[0],
                $lte : price[1],
            }
        })
        .populate('category', '_id name')
        .populate('subs', '_id name')
        .populate('postedBy','_id name')
        .exec();
 
        res.json(products);


    }catch(err){

        console.log(err);

        }
    }


const handleCategory = async (req,res,category)=>{
       try{
           let products = await
            Product.find({
                category
            })
            .populate('category', '_id name')
        .populate('subs', '_id name')
        .populate('postedBy','_id name')
        .exec();
 
        res.json(products);


       }catch(err){
               console.log(err);
       }

}

// 3.33 's ceiling value will be 4
// bur 3.33 's floor value will be 3

const handleStar = (req, res, stars) => {
    Product.aggregate([
      {
        $project: {
          document: "$$ROOT",
          // title: "$title",
          floorAverage: {
            $floor: { $avg: "$ratings.star" }, // floor value of 3.33 will be 3
          },
        },
      },
      { $match: { floorAverage: stars } },
    ])
      .limit(12)
      .exec((err, aggregates) => {
        if (err) console.log("AGGREGATE ERROR", err);
        Product.find({ _id: aggregates })
          .populate("category", "_id name")
          .populate("subs", "_id name")
          .populate("postedBy", "_id name")
          .exec((err, products) => {
            if (err) console.log("PRODUCT AGGREGATE ERROR", err);
            res.json(products);
          });
      });
  };




  const handleSub = async (req,res,sub)=>{
      const products = await Product.find({subs: sub})
      .populate('category', '_id name')
        .populate('subs', '_id name')
        .populate('postedBy','_id name')
        .exec();
        res.json(products);

  }

  const handleShipping =  async(req,res,shipping)=>{
      const products = await Product.find({shipping})
      .populate('category', '_id name')
      .populate('subs', '_id name')
      .populate('postedBy','_id name')
      .exec();
      res.json(products);

  }


  const handleColor =  async(req,res,color)=>{
    const products = await Product.find({color})
    .populate('category', '_id name')
    .populate('subs', '_id name')
    .populate('postedBy','_id name')
    .exec();
    res.json(products);
      
}



const handleBrand =  async(req,res,brand)=>{
    const products = await Product.find({brand})
    .populate('category', '_id name')
    .populate('subs', '_id name')
    .populate('postedBy','_id name')
    .exec();
    res.json(products);
      
}


// search  / Filters
    exports.searchFilters  = async (req,res) =>{
        const {query,price,category,stars,sub,shipping,color,brand} = req.body;
     
         if(query) {
             console.log(query);
             await handleQuery(req,res,query);

         }
         // price [20,1000]
         if(price !== undefined){
             console.log(price);
             await handlePrice (req,res,price)

         }

         if(category){
             console.log(category);
             await handleCategory(req,res,category);

         }
         if(stars){
            console.log(stars);
            await handleStar(req,res,stars);

         }

         if(sub){
             console.log(sub);
             await handleSub(req,res,sub);
         }
         if(shipping){
            console.log(shipping);
            await handleShipping(req,res,shipping);

         }

         if(color){
            console.log(color);
            await handleColor(req,res,color);

         }

         if(brand){
            console.log(brand);
            await handleBrand(req,res,brand);

         }

    }

