const express = require('express');
const path = require('path');
const uuidv4 = require('uuid/v4');
const cookieParser = require('cookie-parser')
const serveStatic = require('serve-static')
const request = require('request')

const app = express();

app.use(cookieParser());

app.use('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "https://cookie-sync-audience-service.herokuapp.com, https://cookie-sync-publisher.herokuapp.com");
  res.header("Access-Control-Allow-Headers", "Origin, partner_1_tracking_id, X-Requested-With, Content-Type, Accept, x-audience-tracking-id, x-partner-1-tracking-id, x-contentFocus");
  res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE, PUT");
  res.header("Access-Control-Allow-Credentials", true);
  next();
});

app.use('/*', (req, res, next) => {
	console.log("Logging Forwarded-For Client IP ", req.headers["x-forwarded-for"])
	console.log("Logging Proxy IP ", req.ip)
	console.log("LOGGING COOKIES: ", req.cookies)
	console.log(" ")
	console.log("Logging user's detected browser: ", req.headers['user-agent'])
	console.log(" ")
		req.headers['x-audience-tracking-id'] = req.query.audience_tracking_id;
		req.headers['x-partner-1-tracking-id'] = req.cookies.partner_1_tracking_id;
		req.headers['x-contentfocus'] = req.query.contentFocus;
		req.headers['x-original-ip'] = req.headers['x-forwarded-for'].split(',')[0]
	if (!req.cookies['partner_1_tracking_id']) {
		console.log('Processed Request - User Does Not Have Cookie.')
		const uniqueID = uuidv4();
		res.setHeader('Set-Cookie', [`partner_1_tracking_id=${uniqueID}`]);
	}
	next();
});

app.get('/track', (req, res, next) => {
	console.log("Attaching Pixel Metadata to Request Body.")
		console.log("Preparing to pipe request to https://cookie-sync-mainframe.herokuapp.com")

		req.pipe(request.get('https://cookie-sync-mainframe.herokuapp.com/sync')
			.on('response', (response) => {
				console.log("Piped Response Received")
				console.log(" ")
				console.log("Logging piped response headers: ", response.headers)
				console.log()
				
			})).pipe(res)
});

app.get('/bidding', (req, res, next) => {
	res.send({
		origin: 'partner-1', 
		bid: Math.random() 
	})
})
app.get('/adwork', async (req, res, next) => {
	console.log("Building Advertisment")
	console.log("")
	req.pipe(request.get('https://cookie-sync-mainframe.herokuapp.com/adworks').on('response', (response) => {
		console.log("Response Received.")
	})).pipe(res)
})

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