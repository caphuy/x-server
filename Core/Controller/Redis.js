"use strict";
var redis = require('redis');
var redisClient = redis.createClient();


redisClient.on('error', function(err) {
    throw err;
});

class Redis
{
    /*
    * Stores a token with user data for a ttl period of time
    * token: String - Token used as the key in redis 
    * data: Object - value stored with the token 
    * ttl: Number - Time to Live in seconds (default: 24Hours)
    * callback: Function
    */
    setTokenWithData(token, data, ttl, callback) {
        if (token == null) throw new Error('Token is null');
        if (data != null && typeof data !== 'object') throw new Error('data is not an Object');

        var userData = data || {};
        userData._ts = new Date();

        var timeToLive = ttl;
        if (timeToLive != null && typeof timeToLive !== 'number') throw new Error('TimeToLive is not a Number');


        redisClient.setex(token, timeToLive, JSON.stringify(userData), function(err, reply) {
            if (err) callback(err);

            if (reply) {
                callback(null, true);
            } else {
                callback(new Error('Token not set in redis'));
            }
        });
        
    };

    /*
    * Check if key is exist
    * callback(null, true) if successfuly
    */
    isSetToken(token, callback) {
        if (token == null) callback(new Error('Token is null'));

        redisClient.exists(token, function(err, res) {
            if (err) callback(err);

            if (res === 1) {
                callback(null);
            }
            else callback(new Error('Token not found'));
        });
    };

    /*
    * Gets the associated data of the token.
    * token: String - token used as the key in redis
    * callback: Function - returns data
    */
    getDataByToken(token, callback) {
        if (token == null) callback(new Error('Token is null'));

        redisClient.get(token, function(err, data) {
            if (err) callback(err);

            if (data != null){
                callback(null, JSON.parse(data));
            }
            else callback(new Error('Token Not Found'));
        });
    };

    /*
    * Expires a token by deleting the entry in redis
    * callback(null, true) if successfuly deleted
    */
    expireToken(token, callback) {
        if (token == null) callback(new Error('Token is null'));

        redisClient.del(token, function(err, reply) {
            if (err) callback(err);

            if (reply) callback(null, true);
            else callback(new Error('Token not found'));
        });
    };
}

var Export = Export || new Redis;
module.exports = Export;