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
const db_1 = require("../db");
const defaultHeadImg_1 = require("./defaultHeadImg");
const bson_1 = require("bson");
function findUserByEmail(email) {
    return __awaiter(this, void 0, void 0, function* () {
        const users = db_1.default.users;
        let user;
        user = yield users.findOne({ email });
        if (user) {
            return user;
        }
        else {
            throw '用户不存在';
        }
    });
}
exports.findUserByEmail = findUserByEmail;
function findUserByUsername(username) {
    return __awaiter(this, void 0, void 0, function* () {
        const users = db_1.default.users;
        let user;
        user = yield users.findOne({ username });
        if (user) {
            return user;
        }
        else {
            throw '用户不存在';
        }
    });
}
exports.findUserByUsername = findUserByUsername;
function findUserById(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const users = db_1.default.users;
        let user;
        user = yield users.findOne({ _id: new bson_1.ObjectID(id) });
        if (user) {
            return user;
        }
        else {
            throw '用户不存在';
        }
    });
}
exports.findUserById = findUserById;
function usernameExists(username) {
    return __awaiter(this, void 0, void 0, function* () {
        const users = db_1.default.users;
        return null !== (yield users.findOne({ username }, { projection: { _id: 1 }, limit: 1 }));
    });
}
exports.usernameExists = usernameExists;
function emailExists(email) {
    return __awaiter(this, void 0, void 0, function* () {
        const users = db_1.default.users;
        const user = yield users.findOne({ email }, { projection: { _id: 1 }, limit: 1 });
        return null !== user;
    });
}
exports.emailExists = emailExists;
function addUser(username, email, password) {
    return __awaiter(this, void 0, void 0, function* () {
        const users = db_1.default.users;
        const result = yield users.insertOne({
            username,
            email,
            password,
            headImg: defaultHeadImg_1.default,
            subscribedCommunities: []
        });
        return {
            _id: result.insertedId,
            username,
            email,
            password: '',
            headImg: defaultHeadImg_1.default,
            subscribedCommunities: []
        };
    });
}
exports.addUser = addUser;
//# sourceMappingURL=user.js.map