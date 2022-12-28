const express = require('express');
const router = express.Router();
var expressHbs =  require('express-handlebars');
const { isLoggedIn } = require('../lib/auth');

var hbs = expressHbs.create({});


//Llamo para conectar la base
const pool = require('../database');

router.get('/', async (req, res) => {
    
    const series = await pool.query('SELECT * FROM series');
    res.render('home/series', {series: series, style: 'style.css'});
    console.log(series);
});

router.get('/series/delete/:id', async (req, res) => {
    const { id } = req.params;
    await pool.query('DELETE FROM series WHERE id = ?', [id]);
    res.redirect('/home');
});

router.get('/series/:id', async (req, res) => {
    const { id } = req.params;
    const series = await pool.query('SELECT * FROM series WHERE id = ?', [id]);
    const commentaries = await pool.query('SELECT * FROM commentaries WHERE serieId = ?', [id]);
    console.log('series > ', series);
    console.log('series > ', series[0]);
    console.log('commentaries >> ', commentaries);
    const counter = commentaries.length;
    res.render('series/details', {series: series[0], commentaries: commentaries, counter: counter, style: 'details.css'});
});

router.get('/addCommentary', (req, res) => {
    res.render('series/addCommentary');
});

router.post('/series/addCommentary/:id', isLoggedIn, async (req, res) => {
    console.log('req.user >>> ', req.user);
    const userId = req.user.id;
    const { username } = req.user;
    console.log('req.params >>> ', req.params);
    const { id } = req.params;
    console.log('id param >>>', id);
    const { description } = req.body;
    console.log('description from form >> ', description);
    const newCommentary = {
        serieId: id,
        idUsuarios: userId,
        description: description,
        username: username
    };
    const commentary = await pool.query('INSERT INTO commentaries set ?',[newCommentary]);
    req.flash('success', 'Commentary added successfully!');
    res.redirect('/home/series/'+id);
});

hbs.handlebars.registerHelper('clickExample', function () {
    console.log('clicked');
});

module.exports = router;