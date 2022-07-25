const express = require('express');
const router = express.Router();

//Llamo para conectar la base
const pool = require('../database');

router.get('/', async (req, res) => {
    
    const series = await pool.query('SELECT * FROM series');
    res.render('home/series', {series: series});
    console.log(series);
});

module.exports = router;