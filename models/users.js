const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    email: { type: String, required: true },
    username: { type: String, required: true },
    forename: { type: String, required: true },
    surname: { type: String, required: true },
    password: { type: String, required: true },
    admin: { type: Boolean, default: false },
    club: { type: Boolean, default: false }
});

// Virtual for user's URL
UserSchema.virtual("url").get(function () {
    // We don't use an arrow function as we'll need the this object
    return `/users/${this._id}`;
  });
  
// Export model
module.exports = mongoose.model("User", UserSchema);