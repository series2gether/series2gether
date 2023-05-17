const express = require('express');
const router = express.Router();
const { isLoggedIn, isAdmin } = require('../lib/auth');

router.get('/', isLoggedIn, isAdmin, async (req, res) => {

	const urlToPass = req.originalUrl;

	const videoURL = urlToPass.replace('/watchRoom?videoSrc=', '');

	res.render('watchRoom/watchRoom', { style: 'style.css', videoURL: videoURL });

});

module.exports = router;