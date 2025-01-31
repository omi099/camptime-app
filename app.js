if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
// console.log(process.env);

const express = require("express");
const app = express();
const ejsMate = require("ejs-mate");
const path = require("path");
const mongoose = require("mongoose");
// const Campground = require("./models/campground");
const methodOverride = require("method-override");
// const catchAsync = require("./utils/catchAsync");
const ExpressError = require("./utils/ExpressError");
// const { campgroundSchema, reviewSchema } = require("./JoiSchemas");
// const Review = require("./models/review");
const session = require("express-session");
const flash = require("express-flash");
const User = require("./models/user");

const helmet = require("helmet");

const passport = require("passport");
const LocalStrategy = require("passport-local");

const campgroundsRoute = require("./routes/campgrounds");
const reviewsRoute = require("./routes/reviews");
const usersRoute = require("./routes/users");

const mongoSanitize = require("express-mongo-sanitize");

const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/yelp-camp";

const MongoStore = require("connect-mongo");

// process.env.DB_URL"

mongoose.connect(dbUrl, {
  // useNewUrlParser: false,
  // // useCreateIndex: true,
  // useUnifiedTopology: false,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Connected to Database");
});

app.set("view engine", "ejs");
app.engine("ejs", ejsMate);
app.set("views", path.join(__dirname, "views"));

app.use(mongoSanitize());

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public"))); //serving public directory

const secret = process.env.SECRET || "thisismysecret";

const store = MongoStore.create({
  mongoUrl: dbUrl,
  touchAfter: 24 * 60 * 60,
  crypto: {
    secret,
  },
});

store.on("error", function (e) {
  console.log("SESSION STORE ERROR!", e);
});

const sessionConfig = {
  store,
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    name: "session", // prevent attack by changing the common name to easily find the session details
    httpOnly: true,
    // secure: true, //localhost does not supports https request so not using for localhost but definitely while deploying
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

app.use(session(sessionConfig));
app.use(flash());

app.use(helmet());

const scriptSrcUrls = [
  "https://stackpath.bootstrapcdn.com",
  "https://api.tiles.mapbox.com",
  "https://api.mapbox.com",
  "https://kit.fontawesome.com",
  "https://cdnjs.cloudflare.com",
  "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
  "https://kit-free.fontawesome.com",
  "https://stackpath.bootstrapcdn.com",
  "https://api.mapbox.com",
  "https://api.tiles.mapbox.com",
  "https://fonts.googleapis.com",
  "https://use.fontawesome.com",
  "https://cdn.jsdelivr.net",
];
const connectSrcUrls = [
  "https://api.mapbox.com",
  "https://*.tiles.mapbox.com",
  "https://events.mapbox.com",
];

const fontSrcUrls = [];
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", "blob:"],
      childSrc: ["blob:"],
      objectSrc: [],
      imgSrc: [
        "'self'",
        "blob:",
        "data:",
        "https://res.cloudinary.com/dcw099zps/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT!
        "https://images.unsplash.com",
      ],
      fontSrc: ["'self'", ...fontSrcUrls],
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  // console.log(req.query);
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.user; // This is the passport method to give user object
  next();
});

// app.get("/fakeUser", async (req, res) => {
//   const user = new User({ email: "omiii@gmail.com", username: "omiii" });
//   const newUser = await User.register(user, "omidot");
//   res.send(newUser);
// });

app.use("/campgrounds", campgroundsRoute);
app.use("/campgrounds/:id/reviews", reviewsRoute);
app.use("/", usersRoute);

app.get("/", (req, res) => {
  res.render("home");
});

app.all("*", (req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Something Went Wrong!!!";
  res.status(statusCode).render("error", { err });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Running on Port ${port}`);
});
