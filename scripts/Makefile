all: clean build-client build-server build-server-app build-utils build-apps create-index

clean:
	rm -rf bin/
	rm -rf build/
	mkdir bin

build-server:
	cp -r src/server bin/server
	cp bin/client/node/stack.io.js bin/server/lib/middleware/auth/stack.js

build-server-app:
	cp -r src/server-app bin/server-app
	cp -r bin/server bin/server-app/stack

build-client:
	mkdir bin/client
	mkdir bin/client/python
	mkdir bin/client/node

	cp src/client/python/stackio.py bin/client/python/stackio.py
	
	./scripts/simple_replace src/client/node/stack.io.js src/client/shared/js/shared.js bin/client/node/stack.io.js

	mkdir build
	./scripts/simple_replace src/client/web/stack.io.js src/client/shared/js/shared.js build/stack.io.js
	node scripts/r.js -o scripts/client-build-prod.cfg.js
	node scripts/r.js -o scripts/client-build-debug.cfg.js
	rm -rf build

build-utils:
	cp -r src/registrar bin/registrar

build-apps:
	cp -r apps bin/apps
	./scripts/build_app dashboard
	./scripts/build_app test
	./scripts/build_app oauth
	./scripts/build_app mice
	./scripts/build_app stress

create-index:
	echo "module.exports = require('./bin/server');" > index.js

npm-distrib: clean build-server build-client build-utils create-index
