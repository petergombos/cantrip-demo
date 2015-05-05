var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var limiter = require("connect-ratelimit");
var cantrips = [];

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(function(err, req, res, next) {
	return next({
		status: 400,
		error: "Invalid JSON supplied in request body."
	});
});

app.use(limiter({
	categories: {
		normal: {
			totalRequests: 100,
			every: 60 * 60 * 1000
		}
	}
}));

app.use(function(req, res, next) {
	if(res.ratelimit.exceeded) {
		return res.send({
			"error": "Rate limit exceeded"
		});
	}
	next();
});

app.get("/", function(req, res) {
	res.redirect("https://kriek.co.uk/cantrip");
});



app.use('/:id',function(req, res, next){
	cantrips[req.params.id] = require("cantrip")({
		file : __dirname + '/data/' + req.params.id + '.json'
	});

	app.use('/'+req.params.id, cantrips[req.params.id]);

	app.use('/'+req.params.id, function(req, res, next) {
		res.send(res.body);
	});

	app.use('/'+req.params.id, function(err, req, res, next) {
		if (err.status) res.status(err.status);
		res.send({
			error: err.error
		});
	});

	next();
});


app.listen(5000);
