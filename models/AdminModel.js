var mongoose = require("mongoose");

var AdminSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email_id: { type: String, required: true },
    password: { type: String, required: true },
    isConfirmed: { type: Boolean, required: true, default: 1 },
    is_active: { type: Boolean, required: true, default: 1 },
    confirmOTP: { type: String, required: false },
    otpTries: { type: Number, required: false, default: 0 },
    status: { type: Boolean, required: true, default: 1 },
    phone_number: { type: String, required: true },
    image: { type: String, required: false },
    designation: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    post_code: { type: String, required: true },
  },
  { timestamps: true }
);

// Virtual for Admin's full name
AdminSchema.virtual("fullName").get(function () {
  return this.first_name + " " + this.last_name;
});

module.exports = mongoose.model("admins", AdminSchema);
