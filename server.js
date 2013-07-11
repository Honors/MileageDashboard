var http = require('http'),
	app = require('./route'),
	crypto = require('crypto'),
	fs = require('fs'),
	mongoose = require('mongoose');
		
mongoose.createConnection('localhost', 'test');

var formDigest = function(username, password) {
	var sha256 = crypto.createHash("sha256");
	sha256.update(username+"ioquewrn"+password+"iqenfklc", "utf-8");
	return sha256.digest("base64").match(/[a-zA-Z0-9]+/g).join('');
};

var auth = function(token, username, password) {
	return formDigest(username, password) == token;
};

var divideUrl = function(url) {
	return url.substr(1).split(/\/|\?/);
};

var setupUserFolder = function(username, cb) {
	fs.stat(__dirname + '/' + username, function(err, stats) {
		if( err ) {
			fs.mkdir(__dirname + '/' + username, cb);
		} else {
			cb();
		}
	});
};

var trip = mongoose.Schema({
	distance: Number,
	id: String,
	location: String,
	Names: String,
	Purpose: String,
	username: String
});
var Trip = mongoose.model('Trip', trip);

var user = mongoose.Schema({
	username: String,
	password: String,
	email: String
});
var User = mongoose.model('MileageUser', user);

var users = [{
	username: "matt",
	password: "drowssap"
}];
var trips = {
	matt: []
};

var userPresent = function(username, cb) {
	User.findOne({username:username}, function(err, docs) {
		cb(docs);
	});
};

var getTrips = function(username, cb) {
	Trip.find({ username: username }, function(err, docs) {
		if( !err ) cb(docs);
		else { cb([]); }
	});
};
var insertTrip = function(username, info) {
	info.username = username;	
	var trip = new Trip(info);
	trip.save();
};
var insertUser = function(info) {
	var user = new User(info);
	user.save();
};

app.get({
	path: /^/,
	cb: function(req, res) {
		res.end("Please refer to API docs.");
	}
}).get({
	path: /^\/asset\/[^\/]+/,
	cb: function(req, res) {
		var file = req.url.substr(1).split('/').slice(1).join('/'),
			path = __dirname + '/' + file;
		fs.stat(path, function(err, stat) {
		    if (!err) {
				res.writeHead(200, {'Content-Type': 'text/html'});
				fs.createReadStream(path).pipe(res);
		    } else {
		        res.writeHead(404);
		        res.end();
		    }
		});
	}
}).get({
	path: /^\/(login|user)$/,
	cb: function(req, res) {
		var pages = { login: '/client/login.html', user: '/client/user.html' };
		res.writeHead(200, { 'Content-Type': 'text/html' });
		fs.createReadStream(__dirname + pages[req.url.substr(1)]).pipe(res);
	}
}).get({
	path: /^\/admin\/dump/,
	cb: function(req, res) {
		User.find({}, function(err, users) {
			Trip.find({}, function(err, trips) {
				res.end(JSON.stringify({
					users: users,
					trips: trips
				}));
			});	
		});
	}
}).post({
	path: /^\/api\/login/,
	cb: function(req, res) {
		var buffer = [];
		req.on("data", function(chunk){buffer.push(chunk)});
		req.on("end", function() {
			var data = JSON.parse(buffer.join(""));
			userPresent(data.username, function(match) {
				var success = match && match.password == data.password;
				res.end(JSON.stringify({ 
					success: !!success, 
					error: success?null:"Auth Failed.", 
					token: success?formDigest(data.username, data.password):null 
				})+'\n');
			});			
		});
	}
}).post({
	path: /^\/api\/register/,
	cb: function(req, res) {
		var buffer = [];
		req.on("data", function(chunk){buffer.push(chunk)});
		req.on("end", function() {
			var data = JSON.parse(buffer.join(""));
			userPresent(data.username, function(match) {
				if( match ) {
					res.end(JSON.stringify({ 
						success: false, 
						error: "Username taken.", 
						token: null
					})+'\n');
				} else {
					insertUser({
						username: data.username,
						password: data.password,
						email: data.email
					});
					res.end(JSON.stringify({ 
						success: true, 
						error: null, 
						token: formDigest(data.username, data.password) 
					})+'\n');
				}
			});			
		});
	}
}).get({
	path: /^\/api\/trips\/[^\/]+/,
	cb: function(req, res) {
		var parts, username, token;
		try {
			parts = divideUrl(req.url);
			username = parts[2];
			// TODO: actual parameter parsing
			token = req.url.split('?')[1].split('=')[1];
		} catch(err) {
			res.end(JSON.stringify({
				success: false, 
				error: "A parse error occurred." 
			}) + '\n');
		}

		var user;
		userPresent(username, function(present) {
			if( !(user = present) ) {
				// Reject invalid usernames.
				res.end(JSON.stringify({
					success: false, 
					error: "User does not exist." 
				}) + '\n');
				return;
			}
			
			if( !auth(token, user.username, user.password) ) {
				// Reject invalid tokens.
				res.end(JSON.stringify({
					success: false, 
					error: "Token invalid." 
				}) + '\n');
				return;
			}
			
			getTrips(user.username, function(trips) {
				res.end(JSON.stringify({
					success: !!trips.length,
					error: trips.length?null:"No trips available.",
					trips: trips
				}) + '\n');
			});
		});		
	}
}).post({
	path: /\/api\/trip\/[^\/]+/,
	cb: function(req, res) {
		var parts, username, token;
		try {
			parts = divideUrl(req.url);
			username = parts[2];
			// TODO: actual parameter parsing
			token = req.url.split('?')[1].split('=')[1];
		} catch(err) {
			res.end(JSON.stringify({
				success: false, 
				error: "A parse error occurred." 
			}) + '\n');
		}

		var buffer = [];
		req.on("data", function(chunk){buffer.push(chunk)});
		req.on("end", function() {
			var data = JSON.parse(buffer.join(""));
			console.log(buffer.join(""));
			var user;
			userPresent(username, function(present) {
				if( !(user = present) ) {
					// Reject invalid usernames.
					res.end(JSON.stringify({
						success: false, 
						error: "User does not exist." 
					}) + '\n');
					return;
				}
				
				if( !auth(token, user.username, user.password) ) {
					// Reject invalid tokens.
					res.end(JSON.stringify({
						success: false, 
						error: "Token invalid." 
					}) + '\n');
					return;
				}
				
				insertTrip(user.username, data);
				res.end(JSON.stringify({ 
					success: true, 
					error: null 
				}) + '\n');
			});									
		});
	}
}).post({
	path: /\/api\/asset\/[^\/]+\/[^\/]+/,
	cb: function(req, res) {
		var username = req.url.substr(1).split('/')[2],
			id_str = req.url.substr(1).split('/')[3].split('?')[0];
			
		var upload, writeCache = [], shouldEnd = false;
		setupUserFolder(username, function() {
			upload = fs.createWriteStream(__dirname+'/'+username+'/'+id_str+'.jpg', {'flags': 'w'});
			writeCache.map(write);
			if( shouldEnd ) {
				upload.end();
			}
		});
		var write = function(chunk) {
			if( upload ) {
				upload.write(chunk);
			} else {
				writeCache.push(chunk);
			}
		};
		var end = function() {
			if( upload ) {
				upload.end();
			} else {
				shouldEnd = true;
			}
		};
		req.on("data", function(chunk) {
			write(chunk);
		});
		req.on("end", function() {			
			end();
			if( !id_str ) {
				res.end(JSON.stringify({ success: false, error: "id or data not provided." }) + '\n');
				return;
			} else {
				res.end(JSON.stringify({ success: true, error: null }) + '\n');
			}
		});		
	}
}).get({
	path: /\/api\/asset\/[^\/]+\/[^\/]+/,
	cb: function(req, res) {
		var parts, username, id_str;
		try {
			parts = divideUrl(req.url);
			username = parts[2];
			id_str = parts[3];
		} catch(err) {
			res.end(JSON.stringify({
				success: false, 
				error: "A parse error occurred." 
			}) + '\n');
		}
		
		fs.stat([__dirname, username, id_str+'.jpg'].join('/'), function(err) {
			if( err ) {
				res.writeHead(404);
				res.end(JSON.stringify({
					success: false, 
					error: "Asset is not present." 
				}) + '\n');
			} else {
				res.writeHead(200, { 'Content-Type': 'image/jpeg' });
				fs.createReadStream([__dirname, username, id_str+'.jpg'].join('/')).pipe(res);
			}
		});
	}
}).get({
	path: /^\/api\/export\/[^\/]+/,
	cb: function(req, res) {
		var parts, username, token;
		try {
			parts = divideUrl(req.url);
			username = parts[2];
			// TODO: actual parameter parsing
			token = req.url.split('?')[1].split('=')[1];
		} catch(err) {
			res.end(JSON.stringify({
				success: false, 
				error: "A parse error occurred." 
			}) + '\n');
		}

		var user;
		userPresent(username, function(present) {
			if( !(user = present) ) {
				// Reject invalid usernames.
				res.end(JSON.stringify({
					success: false, 
					error: "User does not exist." 
				}) + '\n');
				return;
			}
			
			if( !auth(token, user.username, user.password) ) {
				// Reject invalid tokens.
				res.end(JSON.stringify({
					success: false, 
					error: "Token invalid." 
				}) + '\n');
				return;
			}
			
			getTrips(user.username, function(trips) {
				res.writeHead(200, {'Content-Disposition': 'attachment; filename=export.csv'});
				res.end(['Distance', 'Location', 'Purpose', 'People'].join(', ') + '\n' + trips.map(function(trip) {
					var data = [trip.distance, trip.location, trip.purpose, trip.people];
					return ['"', data.join('", "'), '"'].join('');
				}).join('\n'));
			});
		});	
	}
});

exports.module = http.createServer(app);