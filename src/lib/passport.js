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
            return done(null, false, req.flash('error', 'Cuenta no verificada'));
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

passport.use('local.signup', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, username, password, done) => {
    const { email } = req.body;
    const newUser = {
        username : username,
        email: email,
        password: password,
    };
    
    newUser.password = await helpers.encryptPassword(password);
    
    const result = await pool.query('INSERT INTO users set ?', [newUser]);
    newUser.id = result.insertId;
    const token = jwt.sign(
        { _id: newUser.id },
        "secretKey",
        {
            expiresIn: '1d',
        }
    );
    console.log('token > ', token);
    const url = `localhost:4000/user/verify?token=${token}`;
    var contentHTML = `
						<h1>Completa tu registro - Series2gether</h1>
						<h2>Hola ${username}!</h2>
							
						<p>Por favor haz click en el siguiente link, o copialo en la barra de direcciones de tu navegador
						para completar el proceso de registro:</p>
						<a href="${url}">${url}</a>
						<img src="https://st2.depositphotos.com/1606449/7516/i/950/depositphotos_75163555-stock-photo-cats-and-dogs-hanging-paws.jpg"/>
						<p><h3><b>Adogtame S.A.</b></h3><br/>
						<b>Nuestro sitio web:</b> <a href="https://series2gether.herokuapp.com/">Series2gether Web</a><br/>
						<b>Nuestras redes:</b> <img src="http://assets.stickpng.com/images/580b57fcd9996e24bc43c521.png" width="32" heigth="32"/>
						<img src="https://images.vexels.com/media/users/3/223136/isolated/lists/984f500cf9de4519b02b354346eb72e0-facebook-icon-redes-sociales.png" width="32" height="32"/>
						<img src="https://image.similarpng.com/very-thumbnail/2020/06/Logo-Twitter-icon-transparent-PNG.png" width="32" height="32"/><br/>
						<b>Contacto:</b> seriestogetherapp@gmail.com - (54) 11 9999 5555
						</p>
					`;
    const CLIENT_ID = "248951694850-2shvqvgqq2k8a6aaejc7o7ou12sollln.apps.googleusercontent.com";
    const CLIENT_SECRET = "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";
    const REDIRECT_URI = "https://developers.google.com/oauthplayground";
    const REFRESH_TOKEN = "1//04aOsdmuAOAmWCgYIARAAGAQSNwF-L9IrWYthrgeCDbbs2r9-W6m03kW6GdpI3zbchrV-cwe5COdNd2dTZKILGyRJ6VZaPSDlljM";

    const oauthClient = new google.auth.OAuth2(
        CLIENT_ID,
        CLIENT_SECRET,
        REDIRECT_URI
    );

    oauthClient.setCredentials({refresh_token: REFRESH_TOKEN});

    async function sendEmail() {
        try {
            const accessToken = await oauthClient.getAccessToken();
            const transporter = nodemailer.createTransport({
                service:"gmail",
                auth: {
                    type: "OAuth2",
                    user:"seriestogetherapp@gmail.com",
                    clientId: CLIENT_ID,
                    clientSecret: CLIENT_SECRET,
                    refreshToken: REFRESH_TOKEN,
                    accessToken: accessToken
                },
            });
            const mailOptions = {
                from: "'Series2gether Web' <seriestogetherapp@gmail.com>",
                to: email,
                subject: "Confirmacion de registro Seriest2gether Web",
                html: contentHTML
            }

            const result = await transporter.sendMail(mailOptions);
            return result;
        } catch (error) {
            console.log(error);
        }
    }
    sendEmail()
    .then((result) => res.status(200).send("enviado"))
    .catch((error) => console.log(error));
    console.log('result ', result);
    return done(null, newUser);
    //req.flash('success', 'User registered successfully!');
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