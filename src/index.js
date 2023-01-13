const express = require('express');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const flash = require('connect-flash');
const session = require('express-session');
const MySQLStore = require('express-mysql-session');
const passport = require('passport');
const { database } = require('./keys');

//const { exphbs } = pkg;
const path = require('path');
//Initializations
const app = express();
require('./lib/passport');

//Settings
app.set('port', process.env.PORT || 4000);
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs.engine({
    defaultLayout: 'main',
    layoutsDir: path.join(app.get('views'), 'layouts'),
    partialsDir: path.join(app.get('views'), 'partials'),
    loginDir: path.join(app.get('views'), 'login'),
    homeDir: path.join(app.get('views'), 'home'),
    extname: '.hbs',
    helpers: require('./lib/handlebars')
}));
app.set('view engine', '.hbs');
//Middlewares
app.use(session({
    secret: 'secretkey',
    resave: false,
    saveUninitialized: false,
    store: new MySQLStore(database)
}));
app.use(flash());
app.use(morgan('dev'));
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

//Global Variables
app.use((req, res, next) => {
    app.locals.success = req.flash('success');
    app.locals.error = req.flash('error');
    app.locals.user = req.user;
    console.log('locals.user >> ', app.locals.user);
    if(app.locals.user != undefined) {
        app.locals.isAdmin = req.user.profileId == 4 ;
        console.log(app.locals.isAdmin);
    } else {
        app.locals.isAdmin = false;
    }
    
    next();
});

/////////////////////////
//Socket-io
//////////////////////////
var http = require('http').Server(app);
var io = require('socket.io')(http);


// turn off unnecessary header
app.disable('x-powered-by');

// turn on strict routing
app.enable('strict routing');

// use the X-Forwarded-* headers
app.enable('trust proxy');

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Routes
app.use(require('./routes/'));
app.use(require('./routes/authentication'));
app.use('/links',require('./routes/links'));
app.use('/user', require('./routes/user'));
app.use('/home', require('./routes/series'));
app.use('/streaming', require('./routes/streaming')(io));
app.use('/extension', require('./routes/extension'));
app.use('/watchRoom', require('./routes/watchRoom'));

//Public
app.use(express.static(path.join(__dirname, 'public')));

//Starting the server
// Se cambio app.listen `por http.listen
http.listen(app.get('port'), () => {
    console.log('Server on port', app.get('port'));
});