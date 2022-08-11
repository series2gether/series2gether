const bcrypt = require('bcryptjs');
//Llamo para conectar la base
const pool = require('../database');

const helpers = {}

helpers.encryptPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    return hash;
}

helpers.matchPassword = async (password, savedPassword) => {
    console.log(password, savedPassword);
    try {
        return await bcrypt.compare(password, savedPassword);
    } catch (error) {
        console.log(error);
    }
    
}

helpers.checkUsernameAlreadyExists = async(username) => {
    console.log('inside checkusername');
    return await pool.query('SELECT * FROM users WHERE username = ?', username); 
}

helpers.checkEmailAlreadyExists = async(userEmail) => {
    return await pool.query('SELECT * FROM users WHERE email = ?', userEmail); 
}
module.exports = helpers;