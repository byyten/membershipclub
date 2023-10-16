const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ClubSchema = new Schema({
    type: { type: String, required: true },
    password: { type: String, required: true },
});

// Virtual for user's URL
ClubSchema.virtual("url").get(function () {
    // We don't use an arrow function as we'll need the this object
    return `/users/${this._id}`;
  });
  
// Export model
module.exports = mongoose.model("Club", ClubSchema);