var express = require('express');
var router = express.Router();

const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const User = require("../models/users")
const bcrypt = require("bcryptjs")

router.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});


/* GET users listing. */
router.get('/signin', (req, res) => {
  res.render('signin');
});

router.post('/signin', passport.authenticate("local", {
    successRedirect: "/messageboard",
    failureRedirect: "/login"
  })
)

router.get('/register', function(req, res, next) {
  res.render('register');
});

router.post('/register', async (req, res, next) => {
  console.log('process signin');
  // on success  res.redirect("/messageboard");
  // res.send(404);
  bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
    if(err) {
      res.redirect("/register");
    }
    // if err, do something
    // otherwise, store hashedPassword in DB
    try {
      const user = new User({
        email: req.body.email,
        username: req.body.username,
        password: hashedPassword
      });
      const result = await user.save();
      console.log("registered\n" + result);
      res.redirect("/messageboard");
    } catch(err) {
      return next(err);
    };
  })  
});

// logout done
router.get('/signout', async (req, res, next) => {
  console.log('process signout');
  req.logout((err) => {
    if (err) {
      return next(err);
    }
  })
  res.redirect("/");
});


module.exports = router;
