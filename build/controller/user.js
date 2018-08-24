"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = require("../dao/user");
const md5 = require("js-md5");
const jwt_1 = require("../kit/jwt");
const index_1 = require("../common/api/index");
const regexp = require("../kit/regexp");
const mongodb_1 = require("mongodb");
const logger_1 = require("../logger");
const db_1 = require("../db");
const email_1 = require("../kit/email");
const randtoken = require('rand-token');
const rdb = db_1.default.redisdb;
const refreshTokensPrefix = 'refreshTokens';
exports.login = (req, resp) => __awaiter(this, void 0, void 0, function* () {
    const loginReq = req.body;
    loginReq.loginer = loginReq.loginer.trim();
    loginReq.password = loginReq.password.trim();
    let user;
    try {
        // is email
        if (/^[a-z0-9]+([._\\-]*[a-z0-9])*@([a-z0-9]+[-a-z0-9]*[a-z0-9]+.){1,63}[a-z0-9]+$/.test(loginReq.loginer)) {
            user = yield user_1.findUserByEmail(loginReq.loginer);
        }
        else {
            // is username
            user = yield user_1.findUserByUsername(loginReq.loginer);
        }
        if (user.password === md5(loginReq.password)) {
            user.password = '';
            const token = jwt_1.default.sign({ id: user._id.toHexString() });
            const refreshToken = randtoken.uid(256);
            rdb.setex(`${refreshTokensPrefix}:${refreshToken}`, 60 * 60 * 24 * 30, user._id.toHexString());
            const respJson = {
                code: index_1.code.success,
                token,
                refreshToken,
                user
            };
            resp.json(respJson).end();
        }
        else {
            throw '密码错误';
        }
    }
    catch (e) {
        resp.json({
            code: index_1.code.error,
            msg: e.toString()
        });
    }
});
exports.register = (req, resp) => __awaiter(this, void 0, void 0, function* () {
    let { username, password, email } = req.body;
    let c = req.body.code;
    username = username.trim();
    password = md5(password.trim());
    email = email.trim();
    c = c.trim();
    try {
        if (c !== (yield rdb.get(`code:${email}`))) {
            throw '验证码错误';
        }
        if (!regexp.username.test(username)) {
            throw '用户名不合法';
        }
        if (!regexp.email.test(email)) {
            throw '邮箱不合法';
        }
        const user = yield user_1.addUser(username, email, password);
        user.password = '';
        const refreshToken = randtoken.uid(256);
        rdb.setex(`${refreshTokensPrefix}:${refreshToken}`, 60 * 60 * 24 * 30, user._id.toHexString());
        const respJson = {
            code: index_1.code.success,
            user,
            token: jwt_1.default.sign({ id: user._id.toHexString() }),
            refreshToken
        };
        resp.json(respJson);
    }
    catch (e) {
        let msg = e.toString();
        if (e instanceof mongodb_1.MongoError) {
            logger_1.default.error(e);
            if (e.code === 11000) {
                msg = '用户名或邮箱已存在';
            }
            else if (e.code === 121) {
                msg = '数据未通过验证';
            }
            else {
                msg = '数据库错误';
            }
        }
        resp.json({
            code: index_1.code.error,
            msg
        });
    }
});
exports.auth = (req, resp) => __awaiter(this, void 0, void 0, function* () {
    const authorization = req.header('Authorization');
    if (authorization && authorization.startsWith('Bearer ')) {
        const token = authorization.split(' ')[1];
        try {
            const data = jwt_1.default.verify(token);
            if (data.id) {
                try {
                    const user = yield user_1.findUserById(data.id);
                    user.password = '';
                    const respJson = {
                        code: index_1.code.success,
                        user
                    };
                    resp.json(respJson).end();
                }
                catch (e) {
                    resp.json({
                        code: index_1.code.error,
                        msg: e.toString()
                    });
                }
            }
            else {
                resp.json({
                    code: index_1.code.error,
                    msg: 'no auth info'
                });
            }
        }
        catch (error) {
            resp.json({
                code: index_1.code.error,
                msg: 'auth failed'
            });
        }
    }
    else {
        resp.json({
            code: index_1.code.error,
            msg: 'no auth info'
        });
    }
});
exports.authMiddleware = (req, resp, next) => __awaiter(this, void 0, void 0, function* () {
    const authorization = req.header('Authorization');
    if (authorization && authorization.startsWith('Bearer ')) {
        const token = authorization.split(' ')[1];
        let data;
        try {
            data = jwt_1.default.verify(token);
        }
        catch (e) {
            resp.json({
                code: index_1.code.noAuth
            });
            return;
        }
        if (data.id) {
            try {
                const user = yield user_1.findUserById(data.id);
                req.body._self_state_user = user;
                next();
            }
            catch (e) {
                resp.json({
                    code: index_1.code.noAuth
                });
            }
        }
        else {
            resp.json({
                code: index_1.code.noAuth
            });
        }
    }
    else {
        resp.json({
            code: index_1.code.noAuth
        });
    }
});
exports.refreshToken = (req, resp) => __awaiter(this, void 0, void 0, function* () {
    const { id, refreshToken } = req.body;
    if ((yield rdb.get(`${refreshTokensPrefix}:${refreshToken}`)) === id.trim()) {
        const token = jwt_1.default.sign({ id });
        resp.json({ token }).end();
    }
    else {
        resp.status(401).end();
    }
});
exports.confirmEmail = (req, resp) => __awaiter(this, void 0, void 0, function* () {
    let { email } = req.body;
    email = email.trim();
    if (regexp.email.test(email)) {
        const exst = yield user_1.emailExists(email);
        if (exst) {
            resp.json({
                code: index_1.code.error,
                msg: '邮箱已存在'
            });
            return;
        }
        let c = '';
        for (let i = 0; i < 4; i++) {
            c += Math.floor(Math.random() * 10);
        }
        try {
            yield email_1.sendCode(email, c);
            rdb.setex(`code:${email}`, 60 * 20, c);
            yield rdb.expire(`code:${email}`, 60 * 10);
            resp.json({
                code: index_1.code.success
            });
        }
        catch (e) {
            logger_1.default.error(e);
            resp.json({
                code: index_1.code.error,
                msg: '发送失败'
            });
        }
    }
    else {
        resp.json({
            code: index_1.code.error,
            msg: '邮箱格式错误'
        });
    }
});
exports.getUserInfo = (request, response) => __awaiter(this, void 0, void 0, function* () {
    const req = request.body;
    try {
        const user = yield user_1.findUserById(req.id);
        user.password = '';
        const resp = {
            code: index_1.code.success,
            user: Object.assign({}, user, { _id: user._id.toHexString(), subscribedCommunities: user.subscribedCommunities.map((c) => c.toHexString()) })
        };
        response.json(resp);
    }
    catch (err) {
        logger_1.default.error(err);
        response.json({ code: index_1.code.error, msg: 'get failed' });
    }
});
exports.getSubscribedCommunities = (request, response) => __awaiter(this, void 0, void 0, function* () {
    const req = request.body;
    const resp = { code: index_1.code.success, communityIds: [] };
    try {
        const col = db_1.default.interlopers;
        resp.communityIds = (yield col.find({ userId: new mongodb_1.ObjectID(req.userId) }).toArray()).map((e) => e.communityId.toHexString());
        response.json(resp);
    }
    catch (err) {
        logger_1.default.error(err);
        resp.code = index_1.code.error;
        resp.msg = 'error';
        response.json(resp);
    }
});
//# sourceMappingURL=user.js.map