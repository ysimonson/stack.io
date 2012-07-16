all: clean build-client build-server build-server-app build-apps create-index

clean:
	rm -rf bin/
	rm -rf build/
	mkdir bin

build-server:
	cp -r src/server bin/server
	./scripts/simple_replace src/server/lib/client.js src/shared/client.js bin/server/lib/client.js

build-server-app:
	cp -r src/server-app bin/server-app
	cp -r bin/server bin/server-app/stack

build-client:
	mkdir bin/client
	mkdir bin/client/python
	cp src/client/python/stackio.py bin/client/python/stackio.py

	mkdir build
	./scripts/simple_replace src/client/web/stack.io.js src/shared/client.js build/stack.io.js
	node scripts/r.js -o scripts/client-build-prod.cfg.js
	node scripts/r.js -o scripts/client-build-debug.cfg.js
	rm -rf build

build-apps:
	cp -r apps bin/apps
	./scripts/build_app dashboard
	./scripts/build_app test
	./scripts/build_app oauth
	./scripts/build_app mice
	./scripts/build_app stress

create-index:
	echo "module.exports = require('./bin/server');" > index.js

npm-distrib: clean build-server build-client create-index
