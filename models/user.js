const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
// creating a schema
const userSchema = new mongoose.Schema({
  level:{
    type:String,
    default:"1"
  }
  ,
  firstName: {
    type: String,
    required: [true, "First Name is required"],
  },
  lastName: {
    type: String,
    required: [true, "Last Name is required"],
  },
  // profile picture
  avatar: {
    type: String,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    validate: {
      validator: function (email) {
        return String(email)
          .toLowerCase()
          .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
          );
      },
      message: (props) => `Email (${props.value}) is invalid`,
    },
  },
  password: {
    type: String,
  },
  // password changed timestamp.
  passwordChnagedAt: {
    type: Date,
  },
  // password reset token.
  passwordResetToken: {
    type: String,
  },
  // password reset time.
  passwordResetExpires: {
    type: Date,
  },
  // user creation time.
  createdAt: {
    type: Date,
  },
  //   user update time/
  updatedAt: {
    type: Date,
  },
  verified:{
    type:Boolean, 
    default:false
  }, 
  otp:{
    type:Number, 
  }, 
  otp_expiry_time:{
    type: Date, 
  }
});
userSchema.pre("save", async function(next){
  // todo: make the function call only when the otp is updated or modified.

  if(!this.isModified("otp")) return next(); 
  
  // saving otp in encrypted form.

   this.otp = await bcrypt.hash(this.otp, 12);

   next();
});


userSchema.methods.passwordVerification = async function (candiatePassword, userPassword){
      // candidate password => password that is provided by the user.
      return await bcrypt.compare(candiatePassword, userPassword)
}

userSchema.methods.otpVerification = async function (
  candidateOtp,
  userOtp
) {
  // candidate password => password that is provided by the user.
  return await bcrypt.compare(candidateOtp, userOtp);
};

// creating a model  
const User = new mongoose.model("User", userSchema)

module.exports = User;

// todo: define a function in pomodoro and todolist schema for increase the level of the user.