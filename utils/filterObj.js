const filterObj = (obj, ...allowedFields)=>{
      const newObj = {};
      // creating a new object with keys.
      Object.keys(obj).forEach((ele)=>{
            if(allowedFields.includes(ele)) newObj[el] = obj[ele];
      })
      return newObj;
}
module.exports = filterObj;