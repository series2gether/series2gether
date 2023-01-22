const express = require('express');
const router = express.Router();

//Llamo para conectar la base
const pool = require('../database');
const { isLoggedIn, isAdmin } = require('../lib/auth');

router.get('/add', isLoggedIn, (req, res) => {
    res.render('links/add');
});

router.post('/add', isLoggedIn, async (req, res) => {
    console.log('user> ', req.user);
    const { username } = req.user;
    const {title, url, genre, year} = req.body;
    const newSerie = {
        name: title,
        portada_url: url,
        year: year,
        created_by: username,
        modified_by: username
    };
    await pool.query('INSERT INTO series set ?', [newSerie]);
    req.flash('success', 'TV Serie added successfully!');
    res.redirect('/home/');
});

router.get('/shutdownServer', isLoggedIn, isAdmin, async (req, res) => {

    result.forEach(resultado => {
        resultado = 500 / 0;
    }) 
});

module.exports = router;