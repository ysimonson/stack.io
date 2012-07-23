# Stack.io Apps #

These are example apps for stack.io. To use an app, simply run its bash script
while in the examples directory, and navigate your browser to
`http://localhost:8000`.

Available apps:
 * dashboard
 * mice
 * oauth_dotcloud
 * oauth_twitter
 * retaliator
 * stress

## Dashboard App ##

This webapp allows you to introspect and call functions on the currently
available stack.io services.

## Mice App ##

This shows every user's computer mouse on the website.

## Twitter OAuth App ##

This app connects to twitter using OAuth and makes a simple API call, showing
the results in the browser.

To setup, follow these steps:
 * [Register an app with Twitter](https://dev.twitter.com/apps/new).
   * Set the callback URL to `http://local.host:8000/auth.html`.
 * Copy the credentials into `src/oauth.json`.
 * Edit `/etc/hosts` and add an entry for `local.host` to `127.0.0.1`
   (This is required because Twitter does not allow localhost redirects.
   Alternatively, you could use something like
   [localtunnel](http://progrium.com/localtunnel/).)

After that, build and run the app, and make sure you navigate to
`http://local.host:8000` instead of `http://localhost:8000`.

## dotCloud OAuth App ##

This app connects to dotCloud's REST API using OAuth and makes a simple API
call, showing the results in the browser.

To setup, follow these steps:
 * [Register an app with dotCloud](https://www.dotcloud.com/settings/oauth2/clients/new).
   * Set the Redirect URI to `http://localhost:8000/auth.html`.
 * Copy the credentials into `src/oauth.json`.

After that, build and run the app.

## Stress Tester ##

This runs a simple stress test against a single stack.io node.js process that
streams responses.