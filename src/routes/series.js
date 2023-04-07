const express = require('express');
const router = express.Router();
var expressHbs =  require('express-handlebars');
const { isLoggedIn } = require('../lib/auth');
// Import the `express-rate-limit` module
const rateLimit = require("express-rate-limit");

var hbs = expressHbs.create({});



// Create a rate limiter that allows 100 requests per hour
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 2, // limit each IP to 2 requests per windowMs
  message: "Too many requests, please try again later"
});

// Apply the rate limiter to all routes
//app.use(limiter);
router.post('/series/addFavorites/:id', isLoggedIn, limiter, async (req, res) => {
    try {
        console.log('req.limited ', req.limited);
        if (req.limited) {
            throw new Error("Too many requests, please try again later");
        }
        const userId = req.user.id;
        const { id } = req.params;
        console.log('serie id > ', id);
        var favorite = req.body;
        console.log('favorite body > ', favorite);
        const queryFavorite = await pool.query('SELECT * FROM favorites WHERE idUsuario = ? AND idSerie = ?', [userId, id]);
        console.log('queryFavorite ', queryFavorite);

        const newFavorite = {
            idSerie: id,
            idUsuario: userId
        };
        
        if(queryFavorite.length == 0) {
            const favoriteResult = await pool.query('INSERT INTO favorites set ?',[newFavorite]);
            console.log('INSERTED IN DATABASE -- !');
            res.send({
                message: 'Added to favorites!'
            });
        } else {
            const favoriteResult = await pool.query('DELETE FROM favorites WHERE idUsuario = ? AND idSerie = ?',[userId, Number(id)]);
            console.log('DELETED FROM DATABASE -- !');
            res.send({
                message: 'Removed from favorites!'
            });
        }
    } catch (error) {
        if (error.statusCode === 429) {
            console.log('error 429 muchas peticiones');
            return res.status(429).send({
            message: error.message
            });
        } else {
            console.log('#2 error 429 muchas peticiones');
            return res.status(500).send({
            message: "Internal server error"
            });
        }
    }
    
    
    

    
});


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