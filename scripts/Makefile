all: clean build-server build-client build-utils build-apps

clean:
	rm -rf bin/
	mkdir bin

build-server:
	cp -r src/server bin/server
	mkdir bin/server/lib
	cp -r lib/shared/zerorpc-node/src bin/server/lib/zerorpc
	cp src/setup/config.json bin/server/config.json

build-client:
	cp -r src/client bin/client
	scripts/inject lib/client/socket.io.js '' bin/client/stack.io.js

build-utils:
	cp -r src/authorizer bin/authorizer

build-apps:
	cp -r apps bin/apps

	cp -r lib/apps bin/apps/dashboard/static/lib
	cp -r bin/client/stack.io.js bin/apps/dashboard/static/stack.io.js
	mkdir bin/apps/dashboard/server/lib
	cp -r lib/shared/zerorpc-node/src bin/apps/dashboard/server/lib/zerorpc

	cp -r lib/apps bin/apps/test/static/lib
	cp -r bin/client/stack.io.js bin/apps/test/static/stack.io.js
	mkdir bin/apps/test/server/lib
	cp -r lib/shared/zerorpc-node/src bin/apps/test/server/lib/zerorpc
