//////////////////////////////////////////////////////////////////////////
// Configuration                                                        //
//////////////////////////////////////////////////////////////////////////

// express
var express = require('express');
var router = express.Router();
//var app = express();


// socket.io
/*var http = require('http').Server(app);
var io = require('socket.io')(http);*/

// lodash
var lodash = require('lodash');

// request logging
var morgan = require('morgan')
router.use(morgan('short'));

// turn off unnecessary header
/*app.disable('x-powered-by');

// turn on strict routing
app.enable('strict routing');

// use the X-Forwarded-* headers
app.enable('trust proxy');*/

// add CORS headers
router.use(function (req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Credentials', true);
	next();
});

//////////////////////////////////////////////////////////////////////////
// State                                                                //
//////////////////////////////////////////////////////////////////////////

// in-memory store of all the sessions
// the keys are the session IDs (strings)
// the values have the form: {
//   id: 'cba82ca5f59a35e6',                                                                // 8 random octets
//   lastKnownTime: 123,                                                                    // milliseconds from the start of the video
//   lastKnownTimeUpdatedAt: new Date(),                                                    // when we last received a time update
//   messages: [{ userId: '3d16d961f67e9792', body: 'hello', timestamp: new Date() }, ...], // the chat messages for this session
//   ownerId: '3d16d961f67e9792',                                                           // id of the session owner (if any)
//   state: 'playing' | 'paused',                                                           // whether the video is playing or paused
//   userIds: ['3d16d961f67e9792', ...],                                                    // ids of the users in the session
//   videoId: 'abc123',                                                                         // Netflix id the video
//   host:  <host domain here>                                      // location.host
// }
var sessions = {};

// in-memory store of all the users
// the keys are the user IDs (strings)
// the values have the form: {
//   id: '3d16d961f67e9792',        // 8 random octets
//   sessionId: 'cba82ca5f59a35e6', // id of the session, if one is joined
//   socket: <websocket>,           // the websocket
//   typing: false                  // whether the user is typing or not
// }
var users = {};

// generate a random ID with 64 bits of entropy
function makeId() {
	var result = '';
	var hexChars = '0123456789abcdef';
	for (var i = 0; i < 16; i += 1) {
		result += hexChars[Math.floor(Math.random() * 16)];
	}
	return result;
}

//////////////////////////////////////////////////////////////////////////
// Web endpoints                                                        //
//////////////////////////////////////////////////////////////////////////

//streaming
/*router.get('/', function(req, res) {
  console.log('in streaming mode');
  res.send('Hello world');
});*/

// health check
router.get('/healthz', function (req, res) {
	res.setHeader('Content-Type', 'text/plain');
	res.send('OK');
});

// number of sessions
router.get('/number-of-sessions', function (req, res) {
	res.setHeader('Content-Type', 'text/plain');
	res.send(String(Object.keys(sessions).length));
});

// number of users
router.get('/number-of-users', function (req, res) {
	res.setHeader('Content-Type', 'text/plain');
	res.send(String(Object.keys(users).length));
});

router.get('/session-details', function (req, res) {
	res.setHeader('Content-Type', 'application/json')
	res.send(JSON.stringify(sessions))
});

router.post('/reset', function (req, res) {
	sessions = {};
	users = {};
	res.status(200).send()
});

//////////////////////////////////////////////////////////////////////////
// Websockets API                                                       //
//////////////////////////////////////////////////////////////////////////

function validateId(id) {
	return typeof id === 'string' && id.length === 16;
}

function validateLastKnownTime(lastKnownTime) {
	return typeof lastKnownTime === 'number' &&
		lastKnownTime % 1 === 0 &&
		lastKnownTime >= 0;
}

function validateTimestamp(timestamp) {
	return typeof timestamp === 'number' &&
		timestamp % 1 === 0 &&
		timestamp >= 0;
}

function validateBoolean(boolean) {
	return typeof boolean === 'boolean';
}

function validateMessages(messages) {
	if (typeof messages !== 'object' || messages === null || typeof messages.length !== 'number') {
		return false;
	}
	for (var i in messages) {
		if (messages.hasOwnProperty(i)) {
			i = parseInt(i);
			if (isNaN(i)) {
				return false;
			}
			if (typeof i !== 'number' || i % 1 !== 0 || i < 0 || i >= messages.length) {
				return false;
			}
			if (typeof messages[i] !== 'object' || messages[i] === null) {
				return false;
			}
			if (!validateMessageBody(messages[i].body)) {
				return false;
			}
			if (messages[i].isSystemMessage === undefined) {
				messages[i].isSystemMessage = false;
			}
			if (!validateBoolean(messages[i].isSystemMessage)) {
				return false;
			}
			if (!validateTimestamp(messages[i].timestamp)) {
				return false;
			}
			if (!validateId(messages[i].userId)) {
				return false;
			}
		}
	}
	return true;
}

function validateState(state) {
	return typeof state === 'string' && (state === 'playing' || state === 'paused');
}

function validateVideoId(videoId) {
	return typeof videoId === 'string';
}

function validateMessageBody(body) {
	return typeof body === 'string' && body.replace(/^\s+|\s+$/g, '') !== '';
}

function validateHost(host) {
	return typeof host === 'string'
}

function padIntegerWithZeros(x, minWidth) {
	var numStr = String(x);
	while (numStr.length < minWidth) {
		numStr = '0' + numStr;
	}
	return numStr;
}

router.get('/', function (req, res, next) {
	var io = req.app.get('socketio');
	console.log('io >>> ');
	
});


/*var server = http.listen(process.env.PORT || 4000, function() {
  console.log('Listening on port %d.', server.address().port);
});*/

//var server = http.listen(4000);

module.exports = router;
