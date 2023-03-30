const app = require("./app");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
dotenv.config({
      path:"./config.env"
});
// handling errors
process.on("uncaughtException", (err) => {
  console.log(err);
  process.exit(1);
});


const PORT = process.env.PORT || 5000;
const http = require("http");
const server = http.createServer(app);
const DB = process.env.DBURL.replace("<Password>", process.env.DBPassword)
// database connection
mongoose.connect(DB, {
      useNewUrlParser: true,
      // useCreateIndex: true,
      // useFindAndModify: false,
      // useUnifiedToplogy:true,
}).then((connection)=>{
      console.log("database connected successfully");
}).catch((err)=>{
      console.log("Error connecting to database.");
})
server.listen(PORT, () => {
  console.log(`server listening on port ${PORT}`);
});
process.on("unhandledRejection", (err) => {
  console.log(err);
  server.close(()=>{
      process.exit(1);
  });
});