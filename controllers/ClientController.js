const PostcodeModel = require("../models/PostcodeModel");
const { body, validationResult } = require("express-validator");
//helper file to prepare responses.
const apiResponse = require("../helpers/apiResponse");
var mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);

/**
 * User registration.
 *
 * @param {string}      first_name
 * @param {string}      last_name
 * @param {string}      email_id
 * @param {string}      password
 *
 * @returns {Object}
 */
exports.validateStatePostcode = [
  // Validate fields.
  body("state_id", "State Id must be a string").exists().isString(),
  body("postcode", "Postcode must be a number").exists().isInt(),
  // Process request after validation and sanitization.
  (req, res) => {
    try {
      // Extract the validation errors from a request.
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Display sanitized values/errors messages.
        return apiResponse.validationErrorWithData(
          res,
          "Validation Error.",
          errors.array()
        );
      } else {
        const { state_id, postcode } = req.body;
        PostcodeModel.find({
          state: mongoose.Types.ObjectId(state_id),
          post_code: postcode,
        }).then((data) => {
          if (data.length > 0) {
            return apiResponse.successResponseWithData(res, "Success", data);
          } else {
            return apiResponse.successResponseWithData(res, "Failed", data);
          }
        });
      }
    } catch (err) {
      //throw error in json response with status 500.
      return apiResponse.ErrorResponse(res, err);
    }
  },
];
