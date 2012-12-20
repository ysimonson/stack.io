all: clean build-web-client build-stack build-cli build-test

clean:
	rm -rf bin/

create-bin:
	mkdir bin

build-web-client: create-bin
	mkdir bin/client
	node scripts/r.js -o scripts/client-build-prod.cfg.js
	node scripts/r.js -o scripts/client-build-debug.cfg.js
	node scripts/r.js -o scripts/httpclient-build-prod.cfg.js
	node scripts/r.js -o scripts/httpclient-build-debug.cfg.js

build-stack: create-bin
	npm install .
	cp -r src/stack.io bin/stack.io

build-cli: create-bin
	cp src/stackio.js bin/stackio

build-test: create-bin
	cp -r test bin/test
	#cp bin/client/stack.io.debug.js bin/test/static/stack.io.js
	cp bin/client/stack.io-http.debug.js bin/test/static/stack.io.js
