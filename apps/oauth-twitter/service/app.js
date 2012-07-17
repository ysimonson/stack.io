var stack = require("./stack"),
    Twitter = require("twitter");

stack.io(null, function(error, client) {
    client.expose("twitter", "tcp://127.0.0.1:4242", {
        statuses: function(oauth, reply) {
            var twitter = new Twitter({
                consumer_key: oauth.consumerKey,
                consumer_secret: oauth.consumerSecret,
                access_token_key: oauth.accessToken,
                access_token_secret: oauth.accessTokenSecret
            });

            twitter.get("/statuses/home_timeline.json", {include_entities: false}, function(data) {
                reply(null, data, false);
            });
        }
    });
});
