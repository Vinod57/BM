const CauroselModel = require("../models/CauroselModel");
const CategoryModel = require("../models/CategoryModel");
const { body, validationResult } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");
var mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);

exports.CauroselList = [
  (req, res) => {
    try {
      CauroselModel.find()
        .then((data) => {
          return apiResponse.successResponseWithData(res, "Success", data);
        })
        .catch((err) => {
          return apiResponse.ErrorResponse(res, err);
        });
    } catch (error) {
      return apiResponse.ErrorResponse(res, error);
    }
  },
];

exports.CauroselStore = [
  auth,
  body("description")
    .isLength({ min: 1 })
    .trim()
    .escape()
    .withMessage("Description must be specified."),
  body("image")
    .isLength({ min: 1 })
    .trim()
    .escape()
    .withMessage("Image must be specified."),
  body("category")
    .isLength({ min: 1 })
    .trim()
    .escape()
    .withMessage("Category must be specified.")
    .custom((value) => {
      return CategoryModel.findOne({ _id: value }).then((cat) => {
        if (!cat) {
          return Promise.reject("Category Id not available");
        }
      });
    }),
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Display sanitized values/errors messages.
        return apiResponse.validationErrorWithData(
          res,
          "Validation Error.",
          errors.array()
        );
      } else {
        let caurosel = new CauroselModel({
          description: req.body.description,
          image: req.body.image,
          category: req.body.category,
          status: 1,
        });
        caurosel.save((err, data) => {
          if (err) {
            return apiResponse.ErrorResponse(res, err);
          } else {
            return apiResponse.successResponseWithData(res, "Success", data);
          }
        });
      }
    } catch (error) {
      return apiResponse.ErrorResponse(res, error);
    }
  },
];

exports.CauroselUpdate = [
  auth,
  body("description")
    .isLength({ min: 1 })
    .trim()
    .escape()
    .withMessage("Description must be specified."),
  body("image")
    .isLength({ min: 1 })
    .trim()
    .escape()
    .withMessage("Image must be specified."),
  body("status")
    .isLength({ min: 1 })
    .withMessage("Status must be specified.")
    .isIn([0, 1])
    .withMessage("Status must be either 0, 1"),
  body("category")
    .isLength({ min: 1 })
    .trim()
    .escape()
    .withMessage("Category must be specified.")
    .custom((value) => {
      return CategoryModel.findOne({ _id: value }).then((cat) => {
        if (!cat) {
          return Promise.reject("Category Id not available");
        }
      });
    }),
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Display sanitized values/errors messages.
        return apiResponse.validationErrorWithData(
          res,
          "Validation Error.",
          errors.array()
        );
      } else if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        // Display sanitized values/errors messages.
        return apiResponse.validationErrorWithData(
          res,
          "Invalid Id",
          "Invalid Data Id"
        );
      } else {
        CauroselModel.findByIdAndUpdate(
          req.params.id,
          {
            description: req.body.description,
            image: req.body.image,
            category: req.body.category,
            status: req.body.status,
          },
          { new: true }
        ).then((data) => {
          if (!data) {
            return apiResponse.ErrorResponse(res, "Error Update");
          } else {
            return apiResponse.successResponseWithData(res, "Success", data);
          }
        });
      }
    } catch (error) {
      return apiResponse.ErrorResponse(res, error);
    }
  },
];

exports.CauroselDelete = [
  auth,
  (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        // Display sanitized values/errors messages.
        return apiResponse.validationErrorWithData(
          res,
          "Invalid Id",
          "Invalid Data Id"
        );
      } else {
        CauroselModel.findByIdAndDelete(req.params.id, {}).then((data) => {
          if (!data) {
            return apiResponse.ErrorResponse(res, "Error Delete");
          } else {
            return apiResponse.successResponse(res, "Success");
          }
        });
      }
    } catch (error) {
      return apiResponse.ErrorResponse(res, error);
    }
  },
];
