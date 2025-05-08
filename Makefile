app_name = gscholarlens

APP_NAME := gscholarlens
TMP_PATH := /tmp/

build:
	@npx webpack --mode development --config webpack.config.js

prod:
	@npx webpack --mode production --config webpack.config.js

init:
	@npm install webpack webpack-cli cluster child_process net fs path os node-polyfill-webpack-plugin