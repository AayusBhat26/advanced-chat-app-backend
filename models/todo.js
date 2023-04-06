const mongoose = require('mongoose');
const User = require('./user');
const todoSchema = new mongoose.Schema({
      userId:{
            type:mongoose.Schema.Types.ObjectId, 
            ref:User
      }
      , 
      title:{
            type:String,
            default:""
      }, 
      // todo: add the reference to logged in user.

      completed:{
            type:Boolean, 
            default:false
      }, 
      assignedAt:{
            type:Date, 
            default: Date()
      }
})