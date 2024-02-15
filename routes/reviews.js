const express = require('express')
const router = express.Router({mergeParams:true})
const catchAsync = require('../utils/catchAsync');
const ExpressError= require('../utils/ExpressError');
const Review = require('../modals/review');
const Campground = require('../modals/campground'); 
//setting view engine to ejs
const {reviewSchema} = require('../schemas')

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
  
//delete a review
router.delete('/:reviewId',catchAsync(async(req,res)=>{
    const { id , reviewId } = req.params;
    await Review.findByIdAndDelete(reviewId);
    await Campground.findByIdAndUpdate(id,{$pull:{reviews:reviewId}});
    req.flash('success','Created new review')
    res.redirect(`/campgrounds/${id}`)
  }))
//Adding Review Route
router.post('/',validateReview,catchAsync(async(req,res)=>{
    console.log("made here")
    const campground = await Campground.findById(req.params.id);
    const review = new Review(req.body.review);
    console.log(campground)
    console.log(review)
    campground.reviews.push(review);
    await review.save();
    await campground.save();
    req.flash('success','Deleted new review')
    res.redirect(`/campgrounds/${campground._id}`)
}))
module.exports = router