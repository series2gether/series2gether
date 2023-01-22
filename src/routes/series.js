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
    const ratings = await pool.query('SELECT * FROM califications WHERE idSerie = ?', [id]);

    var ratingPromedy = "This show hasnt been rated yet!";
    var alreadyRated = false;
    var isLogged = false;

    if(ratings.length != 0) {
        var totalRating = 0;
        ratings.forEach(rating => {
            totalRating += Number(rating.calification);
            if(req.hasOwnProperty('user')) {
                isLogged = true;
                if(rating.idUser == req.user.id) {
                    console.log('true');
                    alreadyRated = true;
                }
            }
        });
        ratingPromedy = Math.round((totalRating / ratings.length) * 2) / 2;
    }
    
    const counter = commentaries.length;

    if(counter > 0) {
        commentaries.forEach(comment => {
            comment.created_date = formatDate(comment.created_date);
            
        });
    }

    res.render('series/details', {
        series: series[0], 
        commentaries: commentaries, 
        counter: counter, 
        rating: ratingPromedy, 
        style: 'details.css',
        alreadyRated: alreadyRated,
        isLogged: isLogged
    });
});

router.get('/addCommentary', (req, res) => {
    res.render('series/addCommentary');
});

router.post('/series/addRating/:id', isLoggedIn, async (req, res) => {

    const userId = req.user.id;
    const { username } = req.user;
    const { id } = req.params;
    var rating = req.body.eventValue;

    const newRating = {
        idSerie: id,
        idUser: userId,
        calification: rating,
        quantity: 1
    };

    const ratingResult = await pool.query('INSERT INTO califications set ?',[newRating]);
    req.flash('success', 'Rated successfully!');
    res.redirect('/home/series/'+id);
});

router.post('/series/addCommentary/:id', isLoggedIn, async (req, res) => {

    const userId = req.user.id;
    const { username } = req.user;
    const { id } = req.params;
    const { description } = req.body;

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

function formatDate(date) {
    var options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true};
    var dateString = date.toLocaleString('en-US', options);
    return dateString;
}

module.exports = router;