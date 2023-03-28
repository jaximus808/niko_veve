const router = require("express").Router();

// router.post("/setUserCookie", (req,res) =>
// {
//   const name = req.body.usernameSet;
  
//   if(!name)
//   {
//     res.send({error:true})
//     return;
//   }
//   if(name.replace(/\s/g, '') == '')
//   {
//     res.send({error:true})
//     return;
//   }
//   res.cookie(`usernameSet`,name,{ maxAge: 90000000, httpOnly: true });
//   res.send({error:false})
// })
 


module.exports = router;
