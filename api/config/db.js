const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const db = process.env.MongoURI;

// Connection to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // useCreateIndex: true,
      // useFindAndModify: false,
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(err.message);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
