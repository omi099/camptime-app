const mongoose = require("mongoose");
const Campground = require("../models/campground");
const cities = require("./cities");
const { descriptors, places } = require("./seedHelpers");

mongoose.connect("mongodb://localhost:27017/yelp-camp", {
  useNewUrlParser: true,
  //   useCreateIndex: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Connected to Database");
});

const sample = (array) => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
  await Campground.deleteMany({});
  for (let i = 0; i < 200; i++) {
    const random1000 = Math.floor(Math.random() * 1000);
    const price = Math.floor(Math.random() * 20) + 10;
    const newCamp = new Campground({
      title: `${sample(descriptors)} ${sample(places)}`,
      location: `${cities[random1000].city}, ${cities[random1000].state}`,
      images: [
        {
          url: "https://res.cloudinary.com/dcw099zps/image/upload/v1705572987/YelpCamp/evrmrxurvtiwjgghzmcn.png",
          filename: "YelpCamp/evrmrxurvtiwjgghzmcn",
        },
        {
          url: "https://res.cloudinary.com/dcw099zps/image/upload/v1705572990/YelpCamp/bncct8gmpmx1eybon9st.png",
          filename: "YelpCamp/bncct8gmpmx1eybon9st",
        },
      ],
      description:
        "Lorem ipsum dolor sit amet consectetur adipisicing elit. Magni dolorem pariatur labore ratione facilis nesciunt fugit, voluptates iste sit voluptatibus, libero explicabo, dolorum commodi unde iusto? Tempora, quisquam. Aspernatur, perspiciatis?",
      price: price,
      author: "65a66bc7717bd6e59bf97a34",
      geometry: {
        type: "Point",
        coordinates: [
          cities[random1000].longitude,
          cities[random1000].latitude,
        ],
      },

      // when we intially fixed with the constant coordinates colt showed this method to avoid invalid geoJson for some location while creating seeds , but for every seed campground the location would be point to same(Ovando)
    });

    await newCamp.save();
  }
};

seedDB().then(() => {
  mongoose.connection.close();
});
