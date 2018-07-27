// Import packages
var express = require('express');
var Redis = require('ioredis');
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');

// Load env variables
var port = process.env.PORT || 3000;
var redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379/0';

// Connect to Redis
var redis = new Redis(redisUrl);

// Initialize the app
var app = express();
app.set('views', './views');
app.set('view engine', 'jade');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(favicon('./public/assets/favicon.ico'));

// Initialize routes
var main = require('./routes/main.js');
app.use('/', main(redis));
app.use(function(req, res, next) {
  res.status(404).render('404');
});

// Start the server
console.log('Connecting to redis...');
redis.ping(function (err) {
  if (!err) {
    console.log('Connection successful. Server listening on port ' + port);
    app.listen(port);
  }
});

