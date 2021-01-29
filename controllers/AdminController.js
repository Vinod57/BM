const AdminModel = require("../models/AdminModel");
const { body, validationResult } = require("express-validator");
//helper file to prepare responses.
const apiResponse = require("../helpers/apiResponse");
const utility = require("../helpers/utility");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mailer = require("../helpers/mailer");
const { constants } = require("../helpers/constants");

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
exports.register = [
  // Validate fields.
  body("first_name")
    .isLength({ min: 1 })
    .trim()
    .escape()
    .withMessage("First name must be specified.")
    .isAlphanumeric()
    .withMessage("First name has non-alphanumeric characters."),
  body("last_name")
    .isLength({ min: 1 })
    .trim()
    .escape()
    .withMessage("Last name must be specified.")
    .isAlphanumeric()
    .withMessage("Last name has non-alphanumeric characters."),
  body("email_id")
    .isLength({ min: 1 })
    .trim()
    .escape()
    .withMessage("Email must be specified.")
    .isEmail()
    .withMessage("Email must be a valid email address.")
    .custom((value) => {
      return AdminModel.findOne({ email_id: value }).then((user) => {
        if (user) {
          return Promise.reject("E-mail already in use");
        }
      });
    }),
  body("phone_number")
    .isLength({ min: 1 })
    .trim()
    .escape()
    .withMessage("Phone must be specified.")
    .custom((value) => {
      return AdminModel.findOne({ phone_number: value }).then((user) => {
        if (user) {
          return Promise.reject("Phone number already in use");
        }
      });
    }),
  body("password")
    .isLength({ min: 6 })
    .trim()
    .escape()
    .withMessage("Password must be 6 characters or greater."),
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
        //hash input password
        bcrypt.hash(req.body.password, 10, function (err, hash) {
          // generate OTP for confirmation
          let otp = utility.randomNumber(6);
          // Create User object with escaped and trimmed data
          var user = new AdminModel({
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            email_id: req.body.email_id,
            password: hash,
            confirmOTP: otp,
            phone_number: req.body.phone_number,
            designation: req.body.designation,
            address: req.body.address,
            city: req.body.city,
            state: req.body.state,
            post_code: req.body.post_code,
          });
          // Html email body
          let html =
            "<p>Please Confirm your Account.</p><p>OTP: " + otp + "</p>";
          // Send confirmation email
          mailer
            .send(
              constants.confirmEmails.from,
              req.body.email_id,
              "Confirm Account",
              html
            )
            .then(function () {
              // Save user.
              user.save(function (err) {
                if (err) {
                  return apiResponse.ErrorResponse(res, err);
                }
                let userData = {
                  _id: user._id,
                  first_name: user.first_name,
                  last_name: user.last_name,
                  email_id: user.email_id,
                  phone_number: user.phone_number,
                  designation: user.designation,
                  address: user.address,
                  city: user.city,
                  state: user.state,
                  post_code: user.post_code,
                };
                return apiResponse.successResponseWithData(
                  res,
                  "Registration Success.",
                  userData
                );
              });
            })
            .catch((err) => {
              return apiResponse.ErrorResponse(res, err);
            });
        });
      }
    } catch (err) {
      //throw error in json response with status 500.
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

/**
 * User login.
 *
 * @param {string}      email_id
 * @param {string}      password
 *
 * @returns {Object}
 */
exports.login = [
  body("email_id")
    .isLength({ min: 1 })
    .trim()
    .escape()
    .withMessage("Email must be specified.")
    .isEmail()
    .withMessage("Email must be a valid email address."),
  body("password")
    .isLength({ min: 1 })
    .trim()
    .escape()
    .withMessage("Password must be specified."),

  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return apiResponse.validationErrorWithData(
          res,
          "Validation Error.",
          errors.array()
        );
      } else {
        AdminModel.findOne({ email_id: req.body.email_id }).then((user) => {
          if (user) {
            //Compare given password with db's hash.
            bcrypt.compare(
              req.body.password,
              user.password,
              function (err, same) {
                if (same) {
                  //Check account confirmation.
                  if (user.isConfirmed) {
                    // Check User's account active or not.
                    if (user.status) {
                      let otp = utility.randomNumber(6);
                      // Html email body
                      let html =
                        "<p>Please Login your Account.</p><p>OTP: " +
                        otp +
                        "</p>";
                      // Send confirmation email
                      mailer
                        .send(
                          constants.confirmEmails.from,
                          req.body.email_id,
                          "Confirm Account",
                          html
                        )
                        .then(function () {
                          AdminModel.findOneAndUpdate(
                            { email_id: req.body.email_id },
                            {
                              isConfirmed: 1,
                              confirmOTP: otp,
                            }
                          ).catch((err) => {
                            return apiResponse.ErrorResponse(res, err);
                          });
                          let userData = {
                            _id: user._id,
                            first_name: user.first_name,
                            last_name: user.last_name,
                            email_id: user.email_id,
                          };
                          //Prepare JWT token for authentication
                          const jwtPayload = userData;
                          const jwtData = {
                            expiresIn: process.env.JWT_TIMEOUT_DURATION,
                          };
                          const secret = process.env.JWT_SECRET;
                          //Generated JWT token with Payload and secret.
                          userData.token = jwt.sign(
                            jwtPayload,
                            secret,
                            jwtData
                          );
                          return apiResponse.successResponseWithData(
                            res,
                            "Login Success.",
                            userData
                          );
                        });
                    } else {
                      return apiResponse.unauthorizedResponse(
                        res,
                        "Account is not active. Please contact admin."
                      );
                    }
                  } else {
                    return apiResponse.unauthorizedResponse(
                      res,
                      "Account is not confirmed. Please confirm your account."
                    );
                  }
                } else {
                  return apiResponse.unauthorizedResponse(
                    res,
                    "Email or Password wrong."
                  );
                }
              }
            );
          } else {
            return apiResponse.unauthorizedResponse(
              res,
              "Email or Password wrong."
            );
          }
        });
      }
    } catch (err) {
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

/**
 * Verify Confirm otp.
 *
 * @param {string}      email_id
 * @param {string}      otp
 *
 * @returns {Object}
 */
exports.verifyConfirm = [
  body("email_id")
    .isLength({ min: 1 })
    .trim()
    .escape()
    .withMessage("Email must be specified.")
    .isEmail()
    .withMessage("Email must be a valid email address."),
  body("otp")
    .isLength({ min: 1 })
    .trim()
    .escape()
    .withMessage("OTP must be specified."),

  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return apiResponse.validationErrorWithData(
          res,
          "Validation Error.",
          errors.array()
        );
      } else {
        var query = { email_id: req.body.email_id };
        AdminModel.findOne(query).then((user) => {
          if (user) {
            //Check already confirm or not.
            if (true) {
              //Check account confirmation.
              if (user.confirmOTP == req.body.otp) {
                //Update user as confirmed
                AdminModel.findOneAndUpdate(query, {
                  isConfirmed: 1,
                  confirmOTP: null,
                }).catch((err) => {
                  return apiResponse.ErrorResponse(res, err);
                });
                let userData = {
                  _id: user._id,
                  first_name: user.first_name,
                  last_name: user.last_name,
                  email_id: user.email_id,
                };
                //Prepare JWT token for authentication
                const jwtPayload = userData;
                const jwtData = {
                  expiresIn: process.env.JWT_TIMEOUT_DURATION,
                };
                const secret = process.env.JWT_SECRET;
                //Generated JWT token with Payload and secret.
                userData.token = jwt.sign(jwtPayload, secret, jwtData);
                return apiResponse.successResponseWithData(
                  res,
                  "Login Success.",
                  userData
                );
              } else {
                return apiResponse.unauthorizedResponse(
                  res,
                  "Otp does not match"
                );
              }
            } else {
              return apiResponse.unauthorizedResponse(
                res,
                "Account already confirmed."
              );
            }
          } else {
            return apiResponse.unauthorizedResponse(
              res,
              "Specified email not found."
            );
          }
        });
      }
    } catch (err) {
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

/**
 * Resend Confirm otp.
 *
 * @param {string}      email_id
 *
 * @returns {Object}
 */
exports.resendConfirmOtp = [
  body("email_id")
    .isLength({ min: 1 })
    .trim()
    .escape()
    .withMessage("Email must be specified.")
    .isEmail()
    .withMessage("Email must be a valid email address."),

  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return apiResponse.validationErrorWithData(
          res,
          "Validation Error.",
          errors.array()
        );
      } else {
        var query = { email_id: req.body.email_id };
        AdminModel.findOne(query).then((user) => {
          if (user) {
            //Check already confirm or not.
            if (true) {
              // Generate otp
              let otp = utility.randomNumber(6);
              // Html email body
              let html =
                "<p>Please Login your Account.</p><p>OTP: " + otp + "</p>";
              // Send confirmation email
              mailer
                .send(
                  constants.confirmEmails.from,
                  req.body.email_id,
                  "Confirm Account",
                  html
                )
                .then(function () {
                  user.isConfirmed = 0;
                  user.confirmOTP = otp;
                  // Save user.
                  user.save(function (err) {
                    if (err) {
                      return apiResponse.ErrorResponse(res, err);
                    }
                    return apiResponse.successResponse(
                      res,
                      "Confirm otp sent."
                    );
                  });
                });
            } else {
              return apiResponse.unauthorizedResponse(
                res,
                "Account already confirmed."
              );
            }
          } else {
            return apiResponse.unauthorizedResponse(
              res,
              "Specified email not found."
            );
          }
        });
      }
    } catch (err) {
      return apiResponse.ErrorResponse(res, err);
    }
  },
];