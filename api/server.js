const dotenv = require("dotenv");
const express = require("express");
const path = require("path");
const { fileURLToPath } = require("url");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const sessionParser = require("session-parser");
const compress = require("compression");
const helmet = require("helmet");
const apis = require("./route/api.js");

dotenv.config();
const connectDB = require("./config/db.js");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compress());
app.use(helmet());
app.use(cors());

sessionParser.initialize();

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// Connect to Database
// connectDB();

// Define Routes
app.use("/api", apis);

app.use(express.static("build"));

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

app.get("*", (req, res) => {
  //  res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
});

// SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on PORT ${PORT}`));
