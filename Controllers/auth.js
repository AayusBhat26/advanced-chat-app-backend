const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
// user model
const User = require("../models/user.js");
const filterObj = require("../utils/filterObj.js");

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
  return res.status(200).jsom({
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
  return res.status(200).jsom({
    status: "success",
    message: "LogIn process completed",
    token,
  });
});


exports.forgotPassword = async (req, res, next)=>{
  // sending a link to user for resetting their password.
}

exports.resetPassword = async(req,res, next)=>{
  
}