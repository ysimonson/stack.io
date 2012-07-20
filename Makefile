all: clean build-web-client build-stack build-cli build-test

clean:
	rm -rf bin/
	mkdir bin
	
build-web-client:
	mkdir bin/client
	node scripts/r.js -o scripts/client-build-prod.cfg.js
	node scripts/r.js -o scripts/client-build-debug.cfg.js

build-stack:
	npm install .
	cp -r src/stack.io bin/stack.io

build-cli:
	cp src/stackio.js bin/stackio

build-test:
	cp -r test bin/test
	cp bin/client/stack.io.debug.js bin/test/static/stack.io.js

npm-distrib: clean build-stack build-client
