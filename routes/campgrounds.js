//Now we need to setup mongoose model we will create a new folder model and then require it here
// Time to add some "seeds" now
// Now indexing Campground, then show , new , delete

const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
// const Campground = require("../models/campground");
const { validateCampground, isLoggedIn, isAuthor } = require("../middleware");
const campgrounds = require("../controllers/campgrounds");
const multer = require("multer");
const { storage } = require("../cloudinary");
const upload = multer({ storage });

router
  .route("/")
  .get(catchAsync(campgrounds.index))
  .post(
    isLoggedIn,
    upload.array("image"),
    validateCampground,
    catchAsync(campgrounds.createCampground)
  );

// .post(upload.single("image"), (req, res) => {
//   console.log(req.body, req.file);
//   res.send("IT WORKED!!!");
// });

// .post(upload.array("image"), (req, res) => {
//   console.log(req.body, req.files);
//   res.send("IT WORKED!!!");
// });

router.get("/new", isLoggedIn, campgrounds.renderNewForm);

router
  .route("/:id")
  .get(catchAsync(campgrounds.showCampground))
  .put(
    isLoggedIn,
    isAuthor,
    upload.array("image"),
    validateCampground,
    catchAsync(campgrounds.updateCampground)
  )
  .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground));

router.get(
  "/:id/edit",
  isLoggedIn,
  isAuthor,
  catchAsync(campgrounds.renderEditForm)
);

module.exports = router;
