var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var limiter = require("connect-ratelimit");
var fs = require('fs');
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
	if (res.ratelimit.exceeded) {
		return res.send({
			"error": "Rate limit exceeded"
		});
	}
	next();
});

app.get("/", function(req, res) {
	res.redirect("https://kriek.co.uk/cantrip");
});



app.use('/:id', function(req, res, next) {
	var firstRequest = false;

	if (!fs.existsSync(__dirname + '/data/' + req.params.id + '.json')) {
		firstRequest = true;
	}

	cantrips[req.params.id] = require("cantrip")({
		file: __dirname + '/data/' + req.params.id + '.json'
	});

	if (firstRequest) {
		cantrips[req.params.id].set('/', {
			"todos": [{
				"_createdDate": 1430899221405,
				"_modifiedDate": 1430899221405,
				"_id": "778b81e247f7d2ae38732ccf0087e2207c71f623",
				"text": "Buy some milk"
			}],
			"settings": {
				"foo": "bar"
			}
		});
	}

	app.use('/' + req.params.id, cantrips[req.params.id]);

	app.use('/' + req.params.id, function(req, res, next) {
		res.send(res.body);
	});

	app.use('/' + req.params.id, function(err, req, res, next) {
		if (err.status) res.status(err.status);
		res.send({
			error: err.error
		});
	});

	next();
});


app.listen(5000);