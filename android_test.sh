#!/bin/bash
web-ext lint
web-ext run -t firefox-android --adb-remove-old-artifacts --adb-device 3087SH3001062286 --firefox-apk org.mozilla.fenix
