const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const passport = require('passport');
const {isLoggedIn, isNotLoggedIn, isVerified} = require('../lib/auth');

//Llamo para conectar la base
const pool = require('../database');


//Login Page
router.get('/login', isNotLoggedIn, (req, res) => {
    res.render('user/login');
});

router.post('/login', isNotLoggedIn, (req, res, next) => {
    console.log('working...');
    passport.authenticate('local.signin', {
        successRedirect: '/home',
        failureRedirect: '/user/login',
        failureFlash: true
    })(req, res, next);
});

//Register Page
router.get('/register', isNotLoggedIn, (req, res) => {
    res.render('user/register');
});

router.post('/register', passport.authenticate('local.signup', {
        successRedirect: '/verifyPending',
        failureRedirect: '/register',
        failureFlash: true
}));

//Verify Page
router.get('/verifyFailed', isNotLoggedIn, (req,res,next) => {
    res.render('user/verifyFailed');
});

router.get('/verifySuccess', isNotLoggedIn, (req,res,next) => {
    res.render('user/verifySuccess');
});

router.get('/verifyPending', isNotLoggedIn, (req,res,next) => {
    res.render('user/verifyPending');
});

router.get('/verify?:token', isNotLoggedIn, (req, res, next) => {
    console.log('Autenticando...');
    passport.authenticate('jwt', {
    session: false,
    successRedirect: '/user/verifySuccess',
    failureRedirect: '/user/verifyFailed',
    failureFlash: true
    })(req, res, next);
});

//Profile Page
router.get('/profile', isLoggedIn, (req, res) => {
    res.render('user/profile');
});

//Logout
router.get('/logout', (req, res) => {
    req.logOut(function(err) {
        if (err) { return next(err); }
        res.redirect('/user/login');
      });
});

function checkPassword(password, repassword) {
    if(password === repassword) {
        return true;
    } else {
        return false;
    }
}

async function checkUserExists(username) {
    const result = await pool.query('SELECT Id FROM users WHERE username = ?', username);
    console.log(result);
    console.log(result.length);

    if(result.length === 0) {
        return false;
    } else {
        return true;
    }
}
module.exports = router;