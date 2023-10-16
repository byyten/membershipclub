var express = require('express');
var router = express.Router();


const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs")
const { body, validator } = require("express-validator")
const Message = require("../models/message")
const User = require("../models/users")
const Club = require("../models/club")

// to set the db field put this in db
//    club_member_secret_password = await bcrypt.hash("club member secret password", 10)

// find and compare 
//    club_pwd = await Club.findOne({type:"club"}).exec()
//    match = await bcrypt.compare("club member secret password", club_pwd.password);
// --------------------------

// to set the db field put this in db
//    administrator_pwd = await bcrypt.hash("administrator secret password", 10)

// find and compare 
//    administrator_pwd = await Club.findOne({type:"admin"}).exec()
//    match = await bcrypt.compare("administrator secret password", administrator_pwd.password);
// --------------------------


passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ username: username });
      if (!user) {
        return done(null, false, { message: "Incorrect username or password" });
      };

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        // passwords do not match!
        return done(null, false, { message: "Incorrect password or username" })
      }
      // if (user.password !== password) {
      //   return done(null, false, { message: "Incorrect password" });
      // };
      return done(null, user);
    } catch(err) {
      return done(err);
    };
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch(err) {
    done(err);
  };
});

router.use(session({ secret: "cats", resave: false, saveUninitialized: true }));
router.use(passport.initialize());
router.use(passport.session());

router.use((req, res, next) => {
  res.locals.user = req.user ;
  next();
});


/* GET users listing. */
router.get('/signin', (req, res) => {
  res.render('signin', {title: "Post-a-Note Sign in"});
});

router.post('/signin', passport.authenticate("local", {
  successRedirect: "/messageboard",
  failureRedirect: "/signin"
})
)

router.get('/signin_club', (req, res) => {
  res.render('signin_club', {title: "Post-a-Note Club Sign in"});
});

async function check_password(type, input_password) {
  let hashed_password = await Club.findOne({type: type}).exec()
  let match = await bcrypt.compare(input_password, hashed_password.password);
  return match
}

router.post('/signin_club', async (req, res, next) => {
  // successRedirect: "/messageboard",
  // failureRedirect: "/signin_club"
  let match = await check_password("club", req.body.password)
  if (match) {
    console.log("correct, do something")
    res.locals.club = true

    let update = await User.findOneAndUpdate({_id: req.user._id},{ $set: { club: true }}).exec()
    res.redirect("/messageboard")   
  } else {
    res.render("signin_club", {title: "Post-a-Note Sign in",  user: req.user ? req.user: false, authenticated: false })
  }
  next()
})

router.get('/signin_admin', (req, res) => {
  res.render('signin_admin', {title: "Post-a-Note Admin Sign in"});
});

router.post('/signin_admin', async (req, res, next) => {
  // successRedirect: "/messageboard",
  // failureRedirect: "/signin_club"
  let match = await check_password("admin", req.body.password)
  if (match) {
    console.log("correct, do something")
    res.locals.admin = true
    let update = await User.findOneAndUpdate({_id: req.user._id},{ $set: { admin: true }}).exec()
    res.redirect("/messageboard")     
  } else {
    res.render("signin_admin", {title: "Post-a-Note Admin Sign in", user: req.user ? req.user: false, authenticated: false })
  }
})


router.get('/register', function(req, res, next) {
  res.render('register', {title: "Post-a-Note Register"});
});

router.post('/register', async (req, res, next) => {
  console.log('process signin');
  body("email").custom(async value => {
    const user = await User.findOne({ email: value} ).exec();
    if (user) {
      // throw new Error('E-mail already in use');
      res.render("register", {title: "Post-a-Note Register",  errors: [`email ${value} is already registered`]})
    }
  }),
  body('password').isLength({ min: 8 }),
  body('confirm').custom((value, { req }) => {
    return value === req.body.password;
  })
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
        password: hashedPassword,
        forename: req.body.forename,
        surname: req.body.surname,
        club: false,
        admin: false
      });
      const result = await user.save();
      console.log("registered\n" + result);
      let messages = await Message.find().exec()
      // res.render("messageboard", {messages: messages, user: req.user, club: req.user.club, admin: req.user.admin })
      res.render("messageboard", {title: "Post-a-Note Register", messages: messages, user: req.user ? req.user: false, club: req.user ? req.user.club: false, admin:req.user ? req.user.admin : false })

      // res.redirect("/messageboard");
    } catch(err) {
      return next(err);
    };
  })  
});

// logout done
router.post('/signout', async (req, res, next) => {
  console.log('process signout');
  req.logout((err) => {
    if (err) {
      return next(err);
    }
  })
  res.render("index", {title: "Post-a-Note Signed out", user: null});
});


/* GET home page. */
router.get('/', function(req, res, next) {
  if (req.user) {
    res.render('index', {title: "Post-a-Note", user: req.user });
  } else {
    res.render('index', {title: "Post-a-Note", user: false, club: false, admin: false });
  }
});

router.get("/messageboard", async (req,res,next) => {
  let messages = await Message.find().exec()
  res.render("messageboard", {title: "Post-a-Note Messages", messages: messages, user: req.user ? req.user: false})
 
})
router.get('/message', function(req, res, next) {
  if (req.user) {
    res.render('post_message', { user: req.user });
  } else {
    res.redirect("/signin")
  }
});
router.post('/message', async (req, res, next) => {
  console.log('process inbound message');
  const message = new Message({
    datetime: Date.now(),
    username: res.locals.user.username,
    subject: req.body.subject,
    content: req.body.content
  })
  const msg = await message.save(message) 
  const messages = await Message.find().exec()
  res.render("messageboard", {title: "Post-a-Note Create Message", messages: messages, user: req.user ? req.user: false })
});

router.get("/message/:id/delete", async (req, res, next) => {
  const result = await Message.findOneAndDelete({_id: req.params.id }).exec()
  let messages = await Message.find().exec()
  res.render("messageboard", {title: "Post-a-Note Messages", messages: messages, user: req.user ? req.user: false})
})

module.exports = router;

