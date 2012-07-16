all: clean build-client build-stack build-server-app build-apps create-index

clean:
	rm -rf bin/
	rm -rf build/
	mkdir bin

build-stack:
	cp -r src/stack.io bin/stack.io
	./scripts/simple_replace src/stack.io/lib/client.js src/shared/client.js bin/stack.io/lib/client.js

build-server-app:
	cp -r src/server-app bin/server-app
	cp -r bin/stack.io bin/server-app/stack

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
	echo "module.exports = require('./bin/stack.io');" > index.js

npm-distrib: clean build-stack build-client create-index
