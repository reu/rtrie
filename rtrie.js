var redis = require("redis"),
    iconv = require("iconv");

/**
 * @class Rtrie
 * @property {Redis} redis the redis client to be used by Rtrie
 *
 * @constructor
 * @param {String} key the key prefixes for indexes and metadata.
 * @param {Redis} redisClient the redis client
 */
function Rtrie(key, redisClient) {
  key = key || "rtrie";
  this.indexKey = key + ":index:";
  this.metadataKey = key + ":metadata:";
  this.redis = redisClient || redis.createClient();
}

/**
 * Searches for a term.
 * @param {String} term the search term
 * @param {Number} limit the maximum number of results
 * @param {Function} callback success callback
 * @api public
 */
Rtrie.prototype.search = function(term) {
  var limit = 20, callback;

  if (arguments.length == 2) {
    // No limit was specified and we received the callback as the second argument.
    callback = arguments[1];
  } else if (arguments.length == 3) {
    // All the arguments were provided
    limit = arguments[1];
    callback = arguments[2];
  }

  var redis = this.redis,
      index = this.indexKey + transliterate(term).trim().toLowerCase();

  redis.zrevrange([index, 0, limit - 1], function(error, ids) {
    if (ids.length > 0) {
      redis.hmget(this.metadataKey, ids, function(error, items) {
        callback(items.map(JSON.parse));
      });
    }
  }.bind(this));
}


/**
 * Index the `term` with a given `id`.
 *
 * @param {String} term
 * @param {String} id
 * @param {Object} data JSON serializable data you may want to store directly on the index.
 * @param {Number} priority the relevance of this item in comprassion of others.
 * @api public
 */
Rtrie.prototype.index = function(term, id, data, priority) {
  priority = priority || 0;

  var parts = prefixes(transliterate(term).toLowerCase()),
      multi = this.redis.multi();

  parts.forEach(function(part) {
    multi.zadd(this.indexKey + part, priority, id);

    // Store meta/extra data into a hash to reduce memory usage
    var item = { id: id, term: term, data: data };
    multi.hset(this.metadataKey, id, JSON.stringify(item));
  }.bind(this));

  multi.exec();
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
 * @api private
 */
var converter = new iconv.Iconv("UTF-8", "ASCII//TRANSLIT//IGNORE");
function transliterate(term) {
  return converter.convert(term).toString();
}

module.exports = Rtrie;
