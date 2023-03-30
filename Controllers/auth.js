const jwt = require('jsonwebtoken');



// user model
const User = require("../models/user.js");

// generating a token.
const signToken = (userId)=>jwt.sign({
      userId
}, process.env.JWT_SECRET)

exports.login = async(async (req, res, next) => {
       // login.
      const {email, password} = req.body;

      if(!email || !password){
            return res.status(400).json({
                  status:"Error", 
                  message:"Email and password are required."
            })
      }
      const user =  User.findOne({
            email:email
      }).select("+password");
      if(!user || !(await user.passwwordVerification(password, user.password))){
            return res.status(400).json({
                  status:"Error", 
                  message:"Email or password is incorrect."
            })
      }

      //once all the thingws are validated.
      const token  = signToken(user._id);
      return res.status(200).jsom({
            status :"success", 
            message:"Login In process completed successfully", 
            token
      })
});