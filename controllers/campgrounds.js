const Campground = require("../models/campground");
const { cloudinary } = require("../cloudinary");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });

module.exports.index = async (req, res) => {
  const campgrounds = await Campground.find({});
  res.render("campground/index", { campgrounds });
};

module.exports.renderNewForm = async (req, res) => {
  res.render("campground/new");
};

module.exports.showCampground = async (req, res) => {
  const campground = await Campground.findById(req.params.id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("author");
  if (!campground) {
    req.flash("error", "Cannot Find That Campground");
    return res.redirect("/campgrounds");
  }
  res.render("campground/show", { campground });
};

module.exports.createCampground = async (req, res, next) => {
  const geoData = await geocoder
    .forwardGeocode({
      query: req.body.campground.location,
      limit: 1,
    })
    .send();

  const campground = new Campground(req.body.campground);
  campground.geometry = geoData.body.features[0].geometry;
  campground.images = req.files.map((file) => ({
    url: file.path,
    filename: file.filename,
  }));
  // if (!campground.images.length) {
  //   campground.images = [
  //     {
  //       url: "https://res.cloudinary.com/dcw099zps/image/upload/v1705572987/CampTime/evrmrxurvtiwjgghzmcn.png",
  //       filename: "CampTime/evrmrxurvtiwjgghzmcn.png",
  //     },
  //   ];
  // }

  // above logic is added by me , may be if we dont want the default image for no-image campground to avoid adding into database this method is not suggested
  campground.author = req.user._id;
  await campground.save();
  console.log(campground);
  req.flash("success", "Campground CREATED Successfully!!!");
  res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.deleteCampground = async (req, res) => {
  const { id } = req.params;
  await Campground.findByIdAndDelete(id);
  req.flash("success", "Campground DELETED Successfully!!!");
  res.redirect("/campgrounds");
};

module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const campground = await Campground.findById(id);
  if (!campground) {
    req.flash("error", "Cannot Find That Campground");
    res.redirect("/campgrounds");
  }
  res.render("campground/edit", { campground });
};

module.exports.updateCampground = async (req, res) => {
  const { id } = req.params;
  // console.log(req.body.campground);
  const campground = await Campground.findByIdAndUpdate(id, {
    ...req.body.campground,
  });
  const imgs = req.files.map((file) => ({
    url: file.path,
    filename: file.filename,
  }));
  campground.images.push(...imgs);
  // console.log(req.body);
  if (req.body.deleteImages) {
    for (let filename of req.body.deleteImages) {
      cloudinary.uploader.destroy(filename);
    }
    await campground.updateOne({
      $pull: { images: { filename: { $in: req.body.deleteImages } } },
    });
  }
  console.log(campground.images);
  campground.save();
  req.flash("success", "Campground UPDATED Successfully!!!");
  res.redirect(`/campgrounds/${campground._id}`);
};
