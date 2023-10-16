const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const MessageSchema = new Schema({
    username: { type: String, required: true },
    datetime: { type: Date, required: true },
    subject: { type: String, required: true },
    content: { type: String, required: true }
});

// Virtual for user's URL
MessageSchema.virtual("url").get(function () {
    // We don't use an arrow function as we'll need the this object
    return `/message/${this._id}`;
  });
  
// Export model
module.exports = mongoose.model("Message", MessageSchema);