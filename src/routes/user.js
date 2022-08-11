const express = require('express');
const router = express.Router();
const { body, check, validationResult } = require('express-validator');
const passport = require('passport');
//required for register
const helpers = require('../lib/helpers');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const {google} = require('googleapis');
//end
const {isLoggedIn, isNotLoggedIn, isVerified} = require('../lib/auth');

//Llamo para conectar la base
const pool = require('../database');


//Login Page
router.get('/login', isNotLoggedIn, (req, res) => {
    res.render('user/login');
});

router.post('/login', isNotLoggedIn, (req, res, next) => {
    console.log('working...');
    passport.authenticate('local.signin', {
        successRedirect: '/home',
        failureRedirect: '/user/login',
        failureFlash: true
    })(req, res, next);
});

//Register Page
router.get('/register', isNotLoggedIn, async (req, res) => {
    const result = await pool.query('SELECT username FROM users');
    console.log('result >>> ', result);
    res.render('user/register', {result: JSON.stringify(result)});
});

router.post(
    '/register',
    //----All register validations starts here ----
    check('username').notEmpty().withMessage('Username is required!')
                    .isLength({min: 4, max: 16}).withMessage('Username must be between 4 and 16 characters')
                    .isAlphanumeric().withMessage('Only letters and numbers are allowed')
                    .custom(async value => {
                        return helpers.checkUsernameAlreadyExists(value).then(user => {
                            if(user.length > 0){
                                return Promise.reject('Username already in use');
                            }
                        });
    }),
    check('email').notEmpty().withMessage('Email is required!')
                .isEmail().withMessage('Not a valid e-mail format')
                .custom(async value => {
                    return helpers.checkEmailAlreadyExists(value).then(user => {
                        console.log('user ', user);
                        console.log('user length', user.length);
                        if(user.length > 0){
                            return Promise.reject('E-mail already in use');
                        }
                    });
    }),
    body('password').isLength({min: 8, max: 60}).withMessage('Password must be 4 to 60 characters long')
                    .isStrongPassword().withMessage('Password must contain at least: 1 lower case, 1 upper case, 1 special character, and 1 number'),
    body('repassword').custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Password confirmation does not match password');
        }
    
        // Indicates the success of this synchronous custom validator
        return true;
      }),

    async (req,res) =>{
    const errors = await validationResult(req);
    if (!errors.isEmpty()) {
        console.log('errors ', errors);
        const errorMsg = JSON.parse(JSON.stringify(errors.array()))[0].msg;
        const result = await pool.query('SELECT username FROM users');
      return res.render('user/register', {errorMsg: errorMsg, result: JSON.stringify(result)});
    //----Validations ends here ----
    } else {
        const { email, username, password } = req.body;
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
        const url = `https://series2gether.herokuapp.com/user/verify?token=${token}`;
        var contentHTML = `
        					<h1>Completa tu registro - Series2gether</h1>
        					<h2>Hola ${username}!</h2>
                                
        					<p>Por favor haz click en el siguiente link, o copialo en la barra de direcciones de tu navegador
        					para completar el proceso de registro:</p>
        					<a href="${url}">${url}</a>
        					<img src="https://i.ibb.co/9sPKfsp/sign.png"/>
        					<p><h3><b>Series2gether S.A.</b></h3><br/>
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
        res.render('user/verifyPending');
        req.flash('success', 'User registered successfully!');
    }
});
    
    
// });

//Verify Page
router.get('/verifyFailed', isNotLoggedIn, (req,res,next) => {
    res.render('user/verifyFailed');
});

router.get('/verifySuccess', isNotLoggedIn, (req,res,next) => {
    res.render('user/verifySuccess');
});

router.get('/verifyPending', isNotLoggedIn, (req,res,next) => {
    res.render('user/verifyPending');
});

router.get('/verify?:token', isNotLoggedIn, (req, res, next) => {
    console.log('Autenticando...');
    passport.authenticate('jwt', {
    session: false,
    successRedirect: '/user/verifySuccess',
    failureRedirect: '/user/verifyFailed',
    failureFlash: true
    })(req, res, next);
});

//Profile Page
router.get('/profile', isLoggedIn, (req, res) => {
    res.render('user/profile');
});

//Logout
router.get('/logout', (req, res) => {
    req.logOut(function(err) {
        if (err) { return next(err); }
        res.redirect('/user/login');
      });
});

function checkPassword(password, repassword) {
    if(password === repassword) {
        return true;
    } else {
        return false;
    }
}

async function checkUserExists(username) {
    const result = await pool.query('SELECT Id FROM users WHERE username = ?', username);
    console.log(result);
    console.log(result.length);

    if(result.length === 0) {
        return false;
    } else {
        return true;
    }
}
module.exports = router;