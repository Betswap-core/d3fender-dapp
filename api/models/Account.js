const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AccountSchema = new Schema({
  address: { type: String, required: true },
  timestamp: { type: Date },
  email: { type: String },
  phone: { type: String },
  secret: { type: String }
});

module.exports = mongoose.model('Account', AccountSchema);