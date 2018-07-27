var express = require('express');
var bodyParser = require('body-parser');
var redirectModel = require('../models/Redirect');

module.exports = function (redis) {
  var Redirect = redirectModel(redis);
  var router = express.Router();

  // render admin page
  router.get('/', function(req, res) {
    Redirect.getAll(function(err, redirects) {
      if (err)
        res.status(500).send(err);
      else {
        res.status(200).render('admin', { redirects: redirects });
      }
    });
  })

  // redirect or show 404
  router.get('/:redirect_name', function(req, res) {
    var redirectName = req.params.redirect_name;
    Redirect.get(redirectName, function(err, redirect) {
      if (err)
        res.status(500).send(err);
      else if (!redirect)
        res.status(404).render('404');
      else
        res.redirect(redirect.url);
    });
  });

  // create or update redirect
  router.post('/__redirect__', function(req, res) {
    var key = req.body.key;
    var url = req.body.url;
    if (!key || !url) {
      res.status(400).send("You failed to supply all of the parameters.");
      return;
    }
    Redirect.create(key, url, function(err, redirect) {
      if (err)
        res.status(500).send(err);
      else
        res.redirect('/');
    });
  });

  // delete redirect
  router.delete('/__redirect__', function(req, res) {
    var key = req.body.key;
    if (!key) {
      res.status(400).send("You failed to supply all of the parameters.");
      return;
    }
    Redirect.delete(key, function(err) {
      if (err)
        res.status(500).send(err);
      else
        res.redirect('/');
    });
  });

  return router;
};
