var urlKeyPrefix = "url_";
var clicksKeyPrefix = "clicks_";

var createResponseObject = function(key, url, clicks) {
  return {
    key: key,
    url: url,
    clicks: clicks
  };
};

var redisResponseToObject = function(key, a, b) {
  resultUrl = a[1];
  resultClicks = b[1];
  if (resultUrl && resultClicks)
    return createResponseObject(key, resultUrl, resultClicks);
  else
    return false;
};

var baseKey = function(key, prefix) {
  return key.substring(prefix.length);
};

var tryFancyMatch = function(key) {
    const match = [
        {'pattern': /^SYS-([0-9]+)$/, 'redirect': 'https://linear.app/rockset/issue/'},
        {'pattern': /^IT-([0-9]+)$/, 'redirect': 'https://linear.app/rockset/issue/'},
        {'pattern': /^PLA-([0-9]+)$/, 'redirect': 'https://linear.app/rockset/issue/'},
        {'pattern': /^RS-([0-9]+)$/, 'redirect': 'https://linear.app/rockset/issue/'},
        {'pattern': /^UX-([0-9]+)$/, 'redirect': 'https://linear.app/rockset/issue/'},
        {'pattern': /^SE-([0-9]+)$/, 'redirect': 'https://linear.app/rockset/issue/'},
        {'pattern': /^PM-([0-9]+)$/, 'redirect': 'https://linear.app/rockset/issue/'},
        {'pattern': /^#([0-9]+)$/, 'redirect': 'https://github.com/rockset/rs/issues/'},
        {'pattern': /^D([0-9]+)$/, 'redirect': 'https://rockset.phacility.com/'}
    ];
    for (let m of match) {
        if (m['pattern'].test(key)) {
            return m['redirect'] + key;
        }
    }
    return null;
}

module.exports = function(redis) {
  var Redirect = {};

  Redirect.get = function(key, callback) {
    const fancyRedirect = tryFancyMatch(key);
    if (fancyRedirect) {
        return callback(false, {'url': fancyRedirect});
    }

    key = decodeURIComponent(key.toLowerCase()).replace(/[^a-z0-9_]/g,'-');
    redis.multi({ pipeline: false });
    redis.get(urlKeyPrefix+key);
    redis.get(clicksKeyPrefix+key);
    redis.incr(clicksKeyPrefix+key);
    redis.exec(function(err, result) {
      if (err)
        return callback(err);
      callback(false, redisResponseToObject(key, result[0], result[1]));
    });
  };

  Redirect.create = function(key, url, callback) {
    key = decodeURIComponent(key.toLowerCase()).replace(/[^a-z0-9_]/g,'-');
    redis.multi({ pipeline: false });
    redis.set(urlKeyPrefix+key, url);
    redis.set(clicksKeyPrefix+key, 0);
    redis.exec(function(err, result) {
      if (err) {
        callback(err);
        return;
      }
      callback(false, createResponseObject(key, url, 0));
    });
  };

  Redirect.delete = function(key, callback) {
    key = decodeURIComponent(key.toLowerCase()).replace(/[^a-z0-9_]/g,'-');
    redis.del(urlKeyPrefix+key, clicksKeyPrefix+key, function(err, result) {
      if (err) {
        callback(err);
        return;
      }
      callback(!!err);
    });
  };

  Redirect.getAll = function(callback) {
    redis.keys(urlKeyPrefix+"*", function(keysError, keys) {
      if (keysError)
        return callback(keysError);
      redis.multi({ pipeline: false });
      keys.forEach(function(element) {
        var key = baseKey(element, urlKeyPrefix);
        redis.get(urlKeyPrefix+key);
        redis.get(clicksKeyPrefix+key);
      });
      redis.exec(function(err, results) {
        if (err) {
          callback(err);
          return;
        }
        var resultArray = [];
        for (var i = 0; i < keys.length; i++) {
          var key = baseKey(keys[i], urlKeyPrefix);
          resultArray.push(redisResponseToObject(key, results[2*i], results[2*i+1]));
        }
        resultArray.sort(function(a,b){
          return a.key.localeCompare(b.key);
        });
        callback(false, resultArray);
      });
    });
  };

  return Redirect;
};
