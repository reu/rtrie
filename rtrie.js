var redis = require("redis"),
    iconv = require("iconv"),
    redisClient;

/**
 * Create a redis client, override to provide your own behaviour.
 *
 * @return {RedisClient}
 * @api public
 */
exports.createClient = function() {
  return redisClient || (redisClient = redis.createClient());
}


/**
 * Searches for a term.
 * @param {String} term the search term
 * @param {Function} callback success callback
 * @api public
 */
exports.search = function(term, callback) {
  var redis = exports.createClient(),
      index = "index:" + transliterate(term).trim().toLowerCase();

  // TODO: allow the user to specify the limit
  redis.zrevrange([index, 0, 50], function(error, ids) {
    if (ids.length > 0) {
      redis.hmget("data", ids, function(error, items) {
        items.each(function(item) {
          item = JSON.parse(item);
          callback(item.id, item.term, item.data);
        });
      });
    }
  });
}


/**
 * Return all the `term` prefixes.
 *
 * @param {String} term
 * @return {Array} prefixes of the term
 * @api private
 */
function prefixes(term) {
  return term.split(" ").map(function(word) {
    word = word.trim();

    var prefixes = [];

    for (var i = 0; i < word.length; i++) {
      prefixes.push(word.slice(0, i + 1));
    }

    return prefixes;
  }).reduce(function(words, prefixes) {
    return words.concat(prefixes);
  });
}


/**
 * Transliterate a given `term`.
 *
 * @param {String} term
 * @return {String} the converted ascii version of the string
 */
var converter = new iconv.Iconv("UTF-8", "ASCII//TRANSLIT//IGNORE");
function transliterate(term) {
  return converter.convert(term).toString();
}


/**
 * Index the `term` with a given `id`.
 *
 * @param {String} term
 * @param {String} id
 * @param {Object} data JSON serializable data you may want to store directly on the index.
 * @api public
 */
exports.index = function(term, id, data) {
  var parts = prefixes(transliterate(term).toLowerCase()),
      multi = exports.createClient().multi();

  for (var i = 0; i < parts.length; i++) {
    // TODO: allow the user to specify a custom score
    multi.zadd("index:" + parts[i], parts.length - i, id);

    // Store meta/extra data into a hash to reduce memory usage
    var item = { id: id, term: term, data: data };
    multi.hset("data", id, JSON.stringify(item));
  }

  multi.exec();
}
