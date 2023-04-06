const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const crypto = require("crypto");
// user model
const User = require("../models/user.js");
const filterObj = require("../utils/filterObj.js");
const { promisify } = require("util");

// generating a token.
const signToken = (userId) =>
  jwt.sign(
    {
      userId,
    },
    process.env.JWT_SECRET
  );
// register new user.
exports.register = async (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;

  // filtered object => returns an object.
  const filterBody = filterObj(
    req.body,
    "firstName",
    "lastName",
    "email",
    "password"
  );

  // user exists or not ?
  const exisitingUser = await User.findOne({ email: email });
  // if the user exists and also verified too.

  if (exisitingUser && exisitingUser.verified) {
    return res.status(404).json({
      status: "error",
      message: "email already exists, try using a different email.",
    });
  }
  // user registerted successfully but not verified
  else if (exisitingUser) {
    const updatedUser = await User.findOneAndUpdate(
      {
        email: email,
      },
      filterBody,
      {
        new: true,
        // this will make sure that the updated user details is returned.
        validateModifiedOnly: true,
      }
    );
    req.userId = exisitingUser._id;
    next();
  } else {
    // if no details are available, that would a new user.

    const new_user = await User.create({
      filterBody,
    });
    // generate opt.
    req.userId = new_user._id;
    next();
  }
};
// sending otp functionality
exports.sendOtp = async (req, res, next) => {
  const { userId } = req;
  // generating an otp
  const new_otp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
  });

  // otp expiration time.
  const otp_expiry_time = Date.now() + 10 * 60000; // 10 minutes

  // updating and updating the user schema
  await User.findByIdAndUpdate(userId, {
    otp: new_otp,
    otp_expiry_time,
  });
  //todo: sending an email
  return res.status(200, {
    status: "success",
    message: "OTP Sent Successfully",
  });
};

// verifying the otp.
exports.verifyOtp = async (req, res, next) => {
  // todo: verify otp and update the user record

  const { email, otp } = req.body;
  const user = await User.findOne({
    email,
    otp_expiry_time: {
      $gt: Date.now(),
    },
  });
  if (!user) {
    return res.status(400).json({
      status: "error",
      message: "Email is invalid or OTP has expired",
    });
  }
  if (!(await user.otpVerification(otp, user.otp))) {
    return res.status(400).json({
      status: "error",
      message: "OTP is incorrect.",
    });
  }
  // otp is correct.
  user.verified = true;
  user.otp = undefined;
  // saving the user.
  await user.save({ new: true, validateModifiedOnly: true });

  const token = signToken(user._id);
  return res.status(200).json({
    status: "success",
    message: "OTP verified successfully",
    token,
  });
};

exports.login = async(async (req, res, next) => {
  // login.
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      status: "Error",
      message: "Email and password are required.",
    });
  }
  const user = User.findOne({
    email: email,
  }).select("+password");
  if (!user || !(await user.passwwordVerification(password, user.password))) {
    return res.status(400).json({
      status: "Error",
      message: "Email or password is incorrect.",
    });
  }

  //once all the thingws are validated.
  const token = signToken(user._id);
  return res.status(200).json({
    status: "success",
    message: "LogIn process completed",
    token,
  });
});
// for protecting the routes
exports.protect = async (req, res, next) => {
  // todo: get the jwt token and validate it 
  
  let token ;
  if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")){
    token = req.header.authorization.split(" ")[1];

  }
  else if(req.cookies.jwt){
    token = req.cookies.jwt;
  }
  else{
    return res.status(400).json({
      status:"error", 
      message:"You need to login to access this."
    })
  }

  // todo: verification of token

  const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // todo: user exists or not?
  // since i was generating the jwt token using the user's id therefore it will have user's id 
  const currentUser = await User.findById(decode.userId)
  if(!currentUser){
    return res.status(400).json({
      status:"error", 
      message: "User does not exist",
    })
  }



  // checking whether if the user changed the password or not? 
  if(currentUser.changePasswordAfter(decode.iat)){
    return res.status(400).json({
      status:"error", 
      message:"User recently updated their password"
    })
  }
  req.user = currentUser; 
  next();
};
// types of routes 
// 1. protected => only logged in users are allowed to access these routes
// 2. unprotected => anyone can access these routes.


exports.forgotPassword = async (req, res, next) => {
  // sending a link to user for resetting their password.
  // 1) get the user email => from frontend through req body

  // finding the user according to the provided email./
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    // if the user is not found, which means there is no user with this email.
    return res.status(400).json({
      status: "error, not found",
      message: "No user with provided email address found",
    });
  }
  // 2) generating the temporary token.
  const resetToken = user.createPasswordReset();
  // todo: once deployed change the url/
  const resetUrl = "https:localhost:3000/auth/reset-password";
  // sending the reset token to user.

  try {
    // todo: send email with reset url
    res.status(200).json({
      status: "success",
      message:
        "A password reset link with token has been sent to your provided email address.",
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({
      validateBeforeSave: false,
    });
    return res.status(500).json({
      status: "error",
      message:
        "error occurred while sending the email, try again in some time.",
    });
  }
};

exports.resetPassword = async (req, res, next) => {
  // upadting the user password/
  // todo: 1) get the user based on token.
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  // todo: get the data after comparing it.
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: {
      $gt: Date.now(),
    },
  });
  // if the user has entered the incorrect token
  if (!user) {
    return res.status(400).json({
      status: "error",
      message: "Wrong token or expired token",
    });
  }
  // if the time has expired
  
  // time is not expired and token is valid
  
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();
    
    // todo: send an email ti user informing about password reset

  const token = signToken(user._id);
  return res.status(200).json({
    status: "success",
    message: "Reset Password operation was successful",
    token,
  });
};
