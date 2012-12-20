all: clean build-web-client build-stack build-cli build-test

clean:
	rm -rf bin/

create-bin:
	mkdir bin

build-web-client: create-bin
	mkdir bin/client
	cp src/client/stack.io.js bin/client/stack.io.debug.js
	java -jar tools/closure-compiler.jar --compilation_level SIMPLE_OPTIMIZATIONS --js src/client/stack.io.js --js_output_file bin/client/stack.io.js
	cp src/client/stack.io-http.js bin/client/stack.io-http.debug.js
	java -jar tools/closure-compiler.jar --compilation_level SIMPLE_OPTIMIZATIONS --js src/client/stack.io-http.js --js_output_file bin/client/stack.io-http.js

build-stack: create-bin
	npm install .
	cp -r src/stack.io bin/stack.io

build-cli: create-bin
	cp src/stackio.js bin/stackio

build-test: create-bin
	cp -r test bin/test
	cp bin/client/stack.io-http.debug.js bin/test/static/stack.io.js
