#!/usr/bin/env node
"use strict";

const path = require("node:path");

const proxyPath = path.join(__dirname, "bundled-proxy.min.cjs");
process.argv = [process.argv[0], proxyPath, ...process.argv.slice(2)];
require(proxyPath);
