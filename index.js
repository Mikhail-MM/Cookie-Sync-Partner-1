const express = require('express');
const path = require('path');
const uuidv4 = require('uuid/v4');
const cookieParser = require('cookie-parser')
const serveStatic = require('serve-static')

const app = express();

app.use(cookieParser());

app.use('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "https://cookie-sync-audience-service.herokuapp.com");
  res.header("Access-Control-Allow-Headers", "Origin, partner_1_tracking_id, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE, PUT");
  res.header("Access-Control-Allow-Credentials", true);
  next();
});

app.use('/', (req, res, next) => {
	console.log("Logging FORWARDED-FOR HEADERS", req.headers["x-forwarded-for"])
	console.log("Origin Header:", req.headers["Origin"]);
	console.log("origin header", req.headers['origin'])
	console.log("Logging IP.")
	console.log("REQ.IP :: ", req.ip)
	console.log("REQUEST.CONNECTION.REMOTEADDRESS", req.connection.remoteAddress)
	console.log("LOGGING COOKIES: ", req.cookies)
	if (!req.cookies['partner_1_tracking_id']) {
		console.log('Processed Request - User Does Not Have Cookie.')
		const uniqueID = uuidv4();
		res.setHeader('Set-Cookie', [`partner_1_tracking_id=${uniqueID}`]);
	}
	next();
});

app.use('/public', serveStatic(path.join(__dirname, '/public')))

app.get('*', (req, res) => {
	console.log("Catch-All Handler")
	res.status(200).send("All Clear Chief.")
});


app.use(function(err, req, res, next) {
	console.log(err)
	res.status(err.status || 500).send();
});


const port = process.env.PORT || 7000;

app.listen(port);

console.log(`Audience Service Host listening on ${port}`);