const express = require('express');
const router = express.Router();
var expressHbs =  require('express-handlebars');
const { isLoggedIn, isAdmin } = require('../lib/auth');

var hbs = expressHbs.create({});

//Llamo para conectar la base
const pool = require('../database');

router.get('/', isLoggedIn, isAdmin, async (req, res) => {
    
    res.render('extension/extension', {style: 'style.css'});
});

module.exports = router;