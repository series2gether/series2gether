const express = require('express');
const router = express.Router();
var expressHbs =  require('express-handlebars');
const { isLoggedIn, isAdmin } = require('../lib/auth');
const url = require('url');
const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxyServer({});
const cors = require('cors');

var hbs = expressHbs.create({});

//Llamo para conectar la base
const pool = require('../database');
const { log } = require('console');

router.get('/', isLoggedIn, isAdmin, async (req, res) => {
    
    let videoURL = req.query.videoSrc;
    const options = {
        target: "https://delivery337.akamai-video-content.com", // Proxy target
        port: 5050, // Proxy server listening port
    };
    // Add the CORS headers to the response
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Proxy the request to the target server
    proxy.web(req, res, options, function (e) {
        console.log(e);
    });

    res.render('watchRoom/watchRoom', {style: 'style.css', videoURL: videoURL});
});


module.exports = router;