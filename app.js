//require and execute express
const express = require('express');
const app = express();

//ejs mate for layout and boilerplate
const ejsMate = require('ejs-mate');
app.engine('ejs',ejsMate);

//requiring method override 
const methodOverride = require('method-override');
app.use(methodOverride('_method')); 

//joi is used for validation of stuff in dbs
const Joi = require('joi');
const {campgroundSchema,reviewSchema} = require('./schemas')

//require the path module to basically use path.join
const path = require('path');

//requiring the modal campground for database 
const Campground = require('./modals/campground'); 
const Review = require('./modals/review');

//adding body parser and form parser
app.use(express.urlencoded({extended:true}));
app.use(express.json());

//ErrorClass and wrapasync function
const catchAsync = require('./utils/catchAsync');
const ExpressError= require('./utils/ExpressError');

//connecting to the mongodb using mongoose
const mongoose = require('mongoose');
mongoose.set('strictQuery', true);
mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp')
.then(()=>{
  console.log('Database connected');
}).catch(
  err=>{
    console.log('Network error');
    console.log(err);
  }
)

//setting view engine to ejs
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'));

//validator campground
const validateCampground = (req,res,next)=>{
  const {error}= campgroundSchema.validate(req.body)
  if(error){
    const msg = error.details.map(el=>el.message).join(',')
    throw new ExpressError(msg,400)
  }else{
    next()
  }
}
//validate review
const validateReview =(req,res,next)=>{
  const {error} = reviewSchema.validate(req.body)
  if(error){
    const msg = error.details.map(e=>e.message).join(',')
    throw new ExpressError(msg,400)
  }else{
    next()
  }
}


//This is home route
app.get('/',(req,res)=>{
  res.render('home');
})

//this is for showing all the campgrounds
app.get('/campgrounds',catchAsync(async (req,res)=>{
  const campgrounds = await Campground.find({});
  res.render('campgrounds/index',{campgrounds});
}))

//add new campgrounds
app.get('/campgrounds/new',(req,res)=>{
  res.render('campgrounds/new');
})
app.post('/campgrounds',validateCampground,catchAsync(async(req,res)=>{
  const campground = new Campground(req.body.campground);
  await campground.save();
  res.redirect(`/campgrounds/${campground._id}`);
}))

//show route for particular campground
app.get('/campgrounds/:id',catchAsync(async(req,res)=>{
  const {id} = req.params;
  const campground = await Campground.findById(id).populate('reviews');
  res.render('campgrounds/show',{campground});
}))

//edit form
app.get('/campgrounds/:id/edit',catchAsync(async(req,res)=>{
  const campground = await Campground.findById(req.params.id);
  res.render('campgrounds/edit',{campground});
}))
app.put('/campgrounds/:id',validateCampground,catchAsync(async(req,res)=>{
  const {id} = req.params;
  const campground = await Campground.findByIdAndUpdate(id,{...req.body.campground});
  res.redirect(`/campgrounds/${campground._id}`);
}))

//delete a campground
app.delete('/campgrounds/:id',catchAsync(async(req,res)=>{
  const { id } = req.params;
  await Campground.findByIdAndDelete(id);
  res.redirect('/campgrounds');
}))

//delete a review
app.delete('/campgrounds/:id/reviews/:reviewId',catchAsync(async(req,res)=>{
  const { id , reviewId } = req.params;
  await Review.findByIdAndDelete(reviewId);
  await Campground.findByIdAndUpdate(id,{$pull:{reviews:reviewId}});
  res.redirect(`/campgrounds/${id}`)
}))

//Adding Review Route
app.post('/campgrounds/:id/reviews',validateReview,catchAsync(async(req,res)=>{
  const campground = await Campground.findById(req.params.id);
  const review = new Review(req.body.review);
  campground.reviews.push(review);
  await review.save();
  await campground.save();
  res.redirect(`/campgrounds/${campground._id}`)
}))

//404 page handeling 
app.all('*',(req,res,next)=>{
  // throw new ExpressError('Page not found',404);
  next(new ExpressError('Page is not found',404));
})

// error handeling middleware
app.use((err,req,res,next)=>{
  const {statusCode=500} = err ;
  if(!err.message) err.message = "Something very generic has gone wrong";
  res.status(statusCode).render('error',{err,statusCode});
})

//this is listning the express app 
app.listen(3000,()=>{
  console.log("Serving on port 3000");
})  
