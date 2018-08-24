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
const fs = require("fs");
const md5 = require("js-md5");
const logger_1 = require("../logger");
const db_1 = require("../db");
const index_1 = require("../common/api/index");
const redis = db_1.default.redisdb;
exports.uploadMedia = (req, resp) => __awaiter(this, void 0, void 0, function* () {
    const files = req.files;
    const medias = [];
    for (let name in files) {
        const file = files[name];
        let filename = '';
        if (/^image\/.*/.test(file.mimetype)) {
            filename = `webapp/assets/media/image/${md5(file.name + new Date().toString())}${file.name.substring(file.name.lastIndexOf('.'))}`;
        }
        else if (/^audio\/.*/.test(file.mimetype)) {
            filename = `webapp/assets/media/audio/${md5(file.name + new Date().toString())}${file.name.substring(file.name.lastIndexOf('.'))}`;
        }
        else if (/^video\/.*/.test(file.mimetype)) {
            filename = `webapp/assets/media/video/${md5(file.name + new Date().toString())}${file.name.substring(file.name.lastIndexOf('.'))}`;
        }
        else {
            continue;
        }
        try {
            yield file.mv(filename);
            medias.push({
                name,
                uri: filename.substring(filename.indexOf('/')),
                mimetype: file.mimetype,
                at: new Date().getTime()
            });
        }
        catch (e) {
            logger_1.default.error(e);
        }
    }
    const respJson = {
        code: index_1.code.success,
        medias
    };
    resp.json(respJson);
    setTimeout(() => __awaiter(this, void 0, void 0, function* () {
        const posts = db_1.default.posts;
        const cursor = posts.find({
            content: { $in: medias.map((m) => m.uri) }
        });
        if ((yield cursor.count()) === 0) {
            medias.forEach((m) => {
                fs.unlink(`assets${m.uri}`, (err) => err && logger_1.default.error(err));
            });
        }
    }), 1000 * 60 * 5);
});
//# sourceMappingURL=file.js.map