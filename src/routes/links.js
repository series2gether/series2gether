const express = require('express');
const router = express.Router();

//Llamo para conectar la base
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');

router.get('/add', isLoggedIn, (req, res) => {
    res.render('links/add');
});

router.post('/add', isLoggedIn, async (req, res) => {
    const {title, url, genre, year} = req.body;
    const newSerie = {
        name: title,
        trailer: url,
        year: year
    };
    await pool.query('INSERT INTO series set ?', [newSerie]);
    console.log(req.body);
    req.flash('success', 'TV Serie added successfully!');
    res.redirect('/home/');
});
module.exports = router;