const express = require('express');
const path = require('path');
const uuidv4 = require('uuid/v4');
const cookieParser = require('cookie-parser')
const serveStatic = require('serve-static')
const request = require('request')

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
	console.log("Logging Forwarded-For Client IP ", req.headers["x-forwarded-for"])
	console.log("Logging Proxy IP ", req.ip)
	console.log("LOGGING COOKIES: ", req.cookies)
	if (!req.cookies['partner_1_tracking_id']) {
		console.log('Processed Request - User Does Not Have Cookie.')
		const uniqueID = uuidv4();
		res.setHeader('Set-Cookie', [`partner_1_tracking_id=${uniqueID}`]);
	}
	next();
});

app.get('/track', (req, res, next) => {
	console.log("Tracking Pixel Input: ")
	console.log(req.query.audience_tracking_id)
	console.log(req.query.contentFocus)
	console.log("Attaching Pixel Metadata to Request Body.")
		req.body.audience_service_id = req.query.audience_tracking_id;
		req.body.partner_1_tracking_id = req.cookies.partner_1_tracking_id;
		req.body.contentFocus = req.query.contentFocus;
		console.log("Preparing to pipe request to https://cookie-sync-mainframe.herokuapp.com")

		req.pipe(request.post('https://cookie-sync-mainframe.herokuapp.com/sync')
			.on(response => {
				console.log("Piped Response Received")
				console.log("Logging piped response headers: ", response.headers)
				
			})).pipe(res)
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