
const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
  if (req.user) {
    res.render('index.ejs', { name: req.user.name });
  } else {
    // Handle the case where no user is logged in:
    // Option 1: Redirect to login
    res.redirect('/login');

    // Option 2: Render with a default or no name
    // res.render('index.ejs', { name: 'Guest' });
  }
});

router.get('/register', (req, res) => {
  res.render('register.ejs')
})

router.get('/login', (req, res) => {
   res.render('login.ejs')
})

module.exports = router;
