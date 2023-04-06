const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto")
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
  passwordConfirm:{
    type:String,
  }
  ,
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
// before saving the password, we need to encrypt the password.

userSchema.pre("save", async function (next) {
  // todo: make the function call only when the otp is updated or modified.

  if (!this.isModified("password")) return next();

  // saving password in encrypted form.

  this.password = await bcrypt.hash(this.password, 12);

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
userSchema.methods.createPasswordResetToken = function(){
  // arrow function does not support this keyword.
  // todo: store the generated token in user schema and return it from here, once returned from here, using crypto compare them.
  const resetToken  = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  // user will have 10 minutes to reset the password.
  this.passwordResetExpires = Date.now() + 10 * 60000;  
  return resetToken;
}
// timestamp should be less than passwordchngedat tabhi true aayega
userSchema.methods.changePasswordAfter = function(timestamps){
  return timestamps < this.passwordChnagedAt;
}

// creating a model  x`
const User = new mongoose.model("User", userSchema)

module.exports = User;

// todo: define a function in pomodoro and todolist schema for increase the level of the user.