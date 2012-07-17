var stack = require("./stack"),
    restler = require("restler");

//Prefix for the dotcloud REST API
var ENDPOINT_PREFIX = "https://api-experimental.dotcloud.com/v1/";

stack.io(null, function(error, client) {
    client.expose("dotcloud", "tcp://127.0.0.1:4242", {
        me: function(oauth, reply) {
            var options = {
                method: "GET",

                headers: {
                    "Authorization": "Bearer " + oauth.accessToken,
                    "Accept": "application/json"
                }
            };

            restler.request(ENDPOINT_PREFIX + "me", options).on("complete", function(result, response) {
                if(result instanceof Error) {
                    reply(result);
                } else if(response.statusCode < 200 || response.statusCode > 299) {
                    reply("The request returned a non-OK response code: " + response.statusCode);
                } else {
                    try {
                        var json = JSON.parse(result);
                    } catch(e) {
                        reply("Could not parse JSON: " + e);
                        return;
                    }

                    reply(undefined, json, false);
                }
            });
        }
    });
});
