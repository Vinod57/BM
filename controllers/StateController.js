const StateModel = require("../models/StateModel");
const { body, validationResult } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");
var mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);

// Category Schema
function StateData(data) {
  this.id = data._id;
  this.state_name = data.state_name;
  this.createdAt = data.createdAt;
}

/**
 * State List.
 *
 * @returns {Object}
 */
exports.StateList = [
  auth,
  function (req, res) {
    try {
      StateModel.find({}, "_id state_name status createdAt").then(
        (categories) => {
          if (categories.length > 0) {
            return apiResponse.successResponseWithData(
              res,
              "Operation success",
              categories
            );
          } else {
            return apiResponse.successResponseWithData(
              res,
              "Operation success",
              []
            );
          }
        }
      );
    } catch (err) {
      //throw error in json response with status 500.
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

/**
 * State store.
 *
 * @param {string}      state_name
 *
 * @returns {Object}
 */
exports.StateStore = [
  auth,
  body("state_name", "Name must not be empty.")
    .isLength({ min: 3 })
    .withMessage("Minimum 3 characters.")
    .trim()
    .escape()
    .custom((value, { req }) => {
      return StateModel.findOne({ state_name: value }).then((cat) => {
        if (cat) {
          return Promise.reject("State already exist with this name.");
        }
      });
    }),
  (req, res) => {
    try {
      const errors = validationResult(req);
      var category = new StateModel({
        state_name: req.body.state_name,
      });

      if (!errors.isEmpty()) {
        return apiResponse.validationErrorWithData(
          res,
          "Validation Error.",
          errors.array()
        );
      } else {
        //Save Category.
        category.save(function (err) {
          if (err) {
            return apiResponse.ErrorResponse(res, err);
          }
          let Category_Data = new StateData(category);
          return apiResponse.successResponseWithData(
            res,
            "State add Success.",
            Category_Data
          );
        });
      }
    } catch (err) {
      //throw error in json response with status 500.
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

/**
 * State update.
 *
 * @param {string}      title
 * @param {string}      description
 * @param {string}      isbn
 *
 * @returns {Object}
 */
exports.StateUpdate = [
  auth,
  body("state_name", "Name must not be empty.").isLength({ min: 1 }).trim(),
  (req, res) => {
    try {
      const errors = validationResult(req);
      var category = new StateModel({
        state_name: req.body.state_name,
        _id: req.params.id,
      });

      if (!errors.isEmpty()) {
        return apiResponse.validationErrorWithData(
          res,
          "Validation Error.",
          errors.array()
        );
      } else {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
          return apiResponse.validationErrorWithData(
            res,
            "Invalid Error.",
            "Invalid ID"
          );
        } else {
          StateModel.findById(req.params.id, function (err, foundCategory) {
            if (foundCategory === null) {
              return apiResponse.notFoundResponse(
                res,
                "State not exists with this id"
              );
            } else {
              //update Category.
              StateModel.findByIdAndUpdate(
                req.params.id,
                category,
                {},
                function (err) {
                  if (err) {
                    return apiResponse.ErrorResponse(res, err);
                  } else {
                    let Category_Data = new StateData(category);
                    return apiResponse.successResponseWithData(
                      res,
                      "State update Success.",
                      Category_Data
                    );
                  }
                }
              );
            }
          });
        }
      }
    } catch (err) {
      //throw error in json response with status 500.
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

/**
 * State Delete.
 *
 * @param {string}      id
 *
 * @returns {Object}
 */
exports.StateDelete = [
  auth,
  function (req, res) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return apiResponse.validationErrorWithData(
        res,
        "Invalid Error.",
        "Invalid ID"
      );
    }
    try {
      StateModel.findById(req.params.id, function (err, foundCategory) {
        if (foundCategory === null) {
          return apiResponse.notFoundResponse(
            res,
            "State not exists with this id"
          );
        } else {
          //delete Category.
          StateModel.findByIdAndRemove(req.params.id, function (err) {
            if (err) {
              return apiResponse.ErrorResponse(res, err);
            } else {
              return apiResponse.successResponse(res, "State delete Success.");
            }
          });
        }
      });
    } catch (err) {
      //throw error in json response with status 500.
      return apiResponse.ErrorResponse(res, err);
    }
  },
];
