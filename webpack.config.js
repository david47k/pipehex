"use strict";
const path = require('path');
module.exports = {
    entry: './ts_out/index.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'public'),
    },
    mode: 'production',
};
