const express = require('express');
const router = express.Router();
var expressHbs =  require('express-handlebars');

var hbs = expressHbs.create({});


//Llamo para conectar la base
const pool = require('../database');

router.get('/', async (req, res) => {
    
    const series = await pool.query('SELECT * FROM series');
    res.render('home/series', {series: series});
    console.log(series);
});

router.get('/series/delete/:id', async (req, res) => {
    const { id } = req.params;
    await pool.query('DELETE FROM series WHERE id = ?', [id]);
    res.redirect('/home');
})

hbs.handlebars.registerHelper('clickExample', function () {
    console.log('clicked');
});

module.exports = router;