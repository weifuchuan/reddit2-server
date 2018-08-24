"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const controller_1 = require("./controller");
const logger_1 = require("./logger");
const { serverConfig } = require(path.normalize('../config/index.js'));
const app = express();
app.use(bodyParser.json({ limit: '50mb' })); // for parsing application/json
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true })); // for parsing application/x-www-form-urlencoded
app.all('*', (req, resp, next) => {
    resp.setHeader('Access-Control-Allow-Origin', '*');
    resp.setHeader('Access-Control-Allow-Credentials', 'true');
    resp.setHeader('Access-Control-Allow-Methods', '*');
    resp.setHeader('Access-Control-Allow-Headers', '*');
    resp.setHeader('Access-Control-Expose-Headers', '*');
    next();
});
app.use(express.static('webapp'));
app.use((req, res, next) => {
    logger_1.default.info(req.headers);
    if (req.method.toLowerCase() === 'post') {
        logger_1.default.info(req.body);
    }
    next();
});
controller_1.default(app);
app.listen(serverConfig.port, () => {
    console.log(`server started on port ${serverConfig.port}`);
});
//# sourceMappingURL=index.js.map