all: clean build-server build-server-app build-client build-utils build-apps

clean:
	rm -rf bin/
	mkdir bin

build-server:
	cp -r src/server bin/server

build-server-app:
	cp -r src/server-app bin/server-app
	cp -r bin/server bin/server-app/stack

build-client:
	mkdir bin/client
	node scripts/r.js -o scripts/client-build-prod.cfg.js
	node scripts/r.js -o scripts/client-build-debug.cfg.js

build-utils:
	cp -r src/authorizer bin/authorizer
	node bin/authorizer/sqlite/init-db.js bin/authorizer/sqlite/authorizer.db

	cp -r src/registrar bin/registrar

build-apps:
	cp -r apps bin/apps

	cp -r lib/apps bin/apps/dashboard/static/lib
	cp -r bin/client/stack.io.debug.js bin/apps/dashboard/static/stack.io.js

	cp -r lib/apps bin/apps/test/static/lib
	cp -r bin/client/stack.io.debug.js bin/apps/test/static/stack.io.js

	cp -r lib/apps bin/apps/oauth/static/lib
	cp -r bin/client/stack.io.debug.js bin/apps/oauth/static/stack.io.js

	cp -r lib/apps bin/apps/mice/static/lib
	cp -r bin/client/stack.io.debug.js bin/apps/mice/static/stack.io.js