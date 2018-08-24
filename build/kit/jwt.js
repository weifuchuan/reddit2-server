"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = require("jsonwebtoken");
const md5 = require("js-md5");
const secret = `fuchuan${md5(new Date().toString() + Math.random())}`;
exports.default = {
    sign(data, options = { expiresIn: 3000 }) {
        return jwt.sign({
            data
        }, secret, options);
    },
    verify(token) {
        return jwt.verify(token, secret).data;
    }
};
//# sourceMappingURL=jwt.js.map