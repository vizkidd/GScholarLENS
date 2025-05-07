app_name = gscholarlens

APP_NAME := gscholarlens
TMP_PATH := /tmp/

build:
	@npx webpack --config webpack.config.js