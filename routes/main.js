var express = require('express');
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
  router.get('/:redirect_alias*', function(req, res) {

    // get full query path
    var queryPath = req.params.redirect_alias;
    if (req.params['0']) queryPath += req.params['0'];

    var aliasParts = queryPath.split('/');

    // find longest prefix that is defined and append remaining parts to the path
    // e.g. go/phacility/D123 will work if only go/phacility is defined
    var tryRedirect = function (aliasParts, numAppendedParts) {
        if (numAppendedParts >= aliasParts.length) {
            res.status(404).render('404');
        } else {
            var key = aliasParts.slice(0, aliasParts.length - numAppendedParts).join('/');
            var appendedPath = aliasParts.slice(aliasParts.length - numAppendedParts, aliasParts.length).join('/');
            Redirect.get(key, function(err, redirect) {
              if (err)
                res.status(500).send(err);
              else if (!redirect)
                tryRedirect(aliasParts, numAppendedParts + 1);
              else
                res.redirect(redirect.url + '/' + appendedPath);
            });
        }
    }

    tryRedirect(aliasParts, 0);
  });

  // create or update redirect
  router.post('/redirect', function(req, res) {
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

  // create or update redirect
  router.delete('/redirect', function(req, res) {
    var key = req.body.key;
    if (!key) {
      res.status(400).send("You failed to supply all of the parameters.");
      return;
    }
    Redirect.delete(key, function(err) {
      if (err)
        res.status(500).send(err);
      else
        res.status(200).send("OK");
    });
  });

  return router;
};
