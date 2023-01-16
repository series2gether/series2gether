const express = require('express');
const router = express.Router();
var expressHbs =  require('express-handlebars');
const { isLoggedIn, isAdmin } = require('../lib/auth');
const url = require('url');

var hbs = expressHbs.create({});

//Llamo para conectar la base
const pool = require('../database');
const { log } = require('console');

router.get('/', isLoggedIn, isAdmin, async (req, res) => {
    let videoURL = req.query.videoSrc;
    res.render('watchRoom/watchRoom', {style: 'style.css', videoURL: videoURL});
});


module.exports = router;