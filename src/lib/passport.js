const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const pool = require('../database');
const helpers = require('../lib/helpers');
const nodemailer = require('nodemailer');
const {google} = require('googleapis');
const jwt = require('jsonwebtoken');
const JWTstrategy = require("passport-jwt").Strategy;
const ExtractJWT = require("passport-jwt").ExtractJwt;

passport.use('local.signin', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, email, password, done) => {
    const rows = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if(rows.length > 0) {
        const user = rows[0];
        if(user.verified == 0) {

            console.log('user.verified >>> ', user.verified);
            return done(null, false, req.flash('error', 'Account not verified, please check your inbox e-mail'));
        }
        const validPassword = await helpers.matchPassword(password, user.password);
        
        if(validPassword) {
            done(null, user, req.flash('success','Welcome ' + user.username));
        } else {
            done(null, false, req.flash('error','Incorrect password'));
        }
    } else {
        return done(null, false, req.flash('error','Username doesnt exists'));
    }
}));

passport.use(new JWTstrategy({jwtFromRequest: ExtractJWT.fromUrlQueryParameter("token") , secretOrKey: 'secretKey'},
async (jwtPayload, done) => {
    console.log('executing..');
    try {
        console.log(jwtPayload);
        // const jwtPayload = jwt.verify(req.params.token, 'secretKey');
        // console.log('jwtPayload', jwtPayload);
        const { _id } = jwtPayload//jwt.decode(jwtPayload);
        console.log('id >> ', _id);
        const id = _id;
        console.log('Servidor id => ', id);
        const result = await pool.query('UPDATE users SET verified = ? WHERE id = ?', [1, id]);
        console.log('result >> ', result);
        return done(null, result);
    } catch (e) {
        console.log(e);
        console.log('Servidor entro en el catch');
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
    console.log('user.id ', user.id);
});

passport.deserializeUser(async (id, done) => {
    const rows = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    done(null, rows[0]);
});