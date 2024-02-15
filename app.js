//require and execute express
const express = require('express');
const app = express();
require('dotenv').config()
const dbPass  = process.env.dbPassword
const dbUser = process.env.username
const path = require('path');

const ExpressError= require('./utils/ExpressError');

const flash = require('connect-flash');
const mongoSanitize = require('express-mongo-sanitize')
const session = require('express-session');
const MongoStore = require('connect-mongo');

const mongoose = require('mongoose');
mongoose.set('strictQuery', true);
const dbUrl = `mongodb+srv://${dbUser}:${dbPass}@placescluster.i9y5xho.mongodb.net/?retryWrites=true&w=majority`
mongoose.connect(dbUrl)
.then(()=>{
  console.log('Database connected');
}).catch(
  err=>{
    console.log(dbPass)
    console.log('Network error');
    console.log(err);
  }
);
const store = MongoStore.create({
  mongoUrl: dbUrl,
  touchAfter: 24 * 60 * 60,
  crypto: {
      secret: process.env.dbStoreSecret
  }
});
store.on("error",function(e){
  console.log(`Store error, ${e}`)
})
//ejs mate for layout and boilerplate
const ejsMate = require('ejs-mate');
app.engine('ejs',ejsMate);

app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'));

const methodOverride = require('method-override');
app.use(methodOverride('_method')); 
app.use(express.urlencoded({extended:true}));
app.use(express.json());

app.use(express.static( path.join(__dirname,'public') ) );
app.use(mongoSanitize());
const sessionConfig = {
  store:store,
  secret:'thisismysecreat',
  resave:false,
  saveUninitialized:true,
  cookie:{
    httpOnly:true,
    // secure:true,
    expires:Date.now()+1000*60*60*24*7,
    maxAge:1000*60*60*24*7
  }
}
app.use(session(sessionConfig));


app.use(flash());
app.use((req,res,next)=>{
  res.locals.success = req.flash('success')
  res.locals.error = req.flash('error')
  next()
})
const User = require('./modals/user')
const passport = require('passport')
const LocalStrategy = require('passport-local')
app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

const userRoutes = require('./routes/user')
app.use('/',userRoutes)
const campgroundsRoutes = require('./routes/campgrounds');
app.use('/campgrounds',campgroundsRoutes);
const reviewsRoutes = require('./routes/reviews')
app.use('/campgrounds/:id/reviews',reviewsRoutes)
app.get('/',(req,res)=>{
  res.render('home');
})

// app.get('/fakeUser',async (req,res,next)=>{
//   const user = new User({email:'zantro20@gmail.com',username:'RealUniqueHere' })
//   const newUser = await User.register(user,'uniquezantro20')
//   res.send(newUser)
// })  


app.all('*',(req,res,next)=>{
  next(new ExpressError('Page is not found',404));
})
app.use((err,req,res,next)=>{
  const {statusCode=500} = err ;
  if(!err.message) err.message = "Something very generic has gone wrong";
  res.status(statusCode).render('error',{err,statusCode});
})
app.listen(3000,()=>{
  console.log("Serving on port 3000");
})  
  