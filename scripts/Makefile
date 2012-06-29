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
	cp -r src/client bin/client
	scripts/inject lib/client/socket.io.js '' bin/client/stack.io.js

build-utils:
	cp -r src/authorizer bin/authorizer
	cp -r src/registrar bin/registrar

build-apps:
	cp -r apps bin/apps

	cp -r lib/apps bin/apps/dashboard/static/lib
	cp -r bin/client/stack.io.js bin/apps/dashboard/static/stack.io.js

	cp -r lib/apps bin/apps/test/static/lib
	cp -r bin/client/stack.io.js bin/apps/test/static/stack.io.js
