const express = require("express");

// information regarding to request send and response receive in terminal
const morgan = require("morgan");

// securing the server
// 1. limiting the number of requests.
const rateLimit = require("express-rate-limit");
// 2. securing the headers.
const helmet  = require("helmet")
// context => in my last project, i have seen the issue that includes mongodb, if there is some sort of code that has been sent to another user, mongodb was creating some issues and was not showing it to the messages database.
// 3.  in order to avoid any sort of issue from code.
const mongosanitize = require("express-mongo-sanitize");

const bodyParser = require("body-parser");
const xss = require("xss"); // removal of malicious code sent in request.

const cors  = require("cors");
const app = express();
app.use(express.urlencoded({
      extended:true
}))

// app.use(mongosanitize())
// app.use(xss())

app.use(cors({
      origin:"*",
      methods:["GET", "PUT", "PATCH", "POST", "DELETE"], 
      credentials:true,
}))
app.use(express.json({
      limit:"10kb", // limit the size of data.
}))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
      extended: true,
}))
app.use(helmet());

if(process.env.NODE_ENV==='development'){
      app.use(morgan("dev")) // in order to receive max amount of data.
}
const limiter = rateLimit({
  max: 2200,
  windowMs: 60 * 60 * 1000, // 1 hour=> in 1 hr only 3200 requests are allowed
  message:
    "Too many requests made from single IP, please try again in one hour", // if the number of requests exceeds this message would be sent.
});
app.use("/prod", limiter);// any request made with /prod as the part of url, limiter would be used.


// exporting express app.
module.exports = app;
