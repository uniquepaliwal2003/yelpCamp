const { cities } = require('./cities');
const mongoose = require('mongoose');
const { places , descriptors } = require('./seedHelper');
const Campground = require('../modals/campground');

mongoose.set('strictQuery', true);
mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp')
.then(()=>{
  console.log('Newwork connected');
}).catch(
  err=>{
    console.log('Network error');
    console.log(err);
  }
)

const sample = array => array[Math.floor(Math.random()*array.length)];

const seedDB = async () =>{
  await Campground.deleteMany({});
  for( let i = 0 ; i < 50 ; i++ ){
    const random1000 = Math.floor(Math.random()*1000);
    const price = Math.floor(Math.random()*20)+10;
    const camp = new Campground({
      location:`${cities[random1000].city} , ${cities[random1000].state}`,
      title:`${sample(descriptors)} , ${sample(places)}`,
      image:'https://source.unsplash.com/collection/483251',
      description:'Lorem ipsum dolor sit amet consectetur adipisicing elit. Laborum maxime a sit deleniti expedita earum sapiente laudantium, explicabo atque ullam, consequatur unde debitis.',
      price
    })
    await camp.save();
  }
}

seedDB().then(()=>{
  mongoose.connection.close();
})