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
const dao = require("../dao/community");
const index_1 = require("../common/api/index");
const bson_1 = require("bson");
const db_1 = require("../db");
const logger_1 = require("../logger");
exports.getCommunitiesInfo = (req, resp) => __awaiter(this, void 0, void 0, function* () {
    const { ids } = req.body;
    try {
        const comms = yield dao.getCommunities(ids.map((id) => new bson_1.ObjectID(id)));
        const respJson = {
            code: index_1.code.success,
            communities: comms.map((comm) => (Object.assign({}, comm, { _id: comm._id.toHexString() })))
        };
        resp.json(respJson);
    }
    catch (err) {
        resp.json({ code: index_1.code.error, msg: 'inner server error' });
    }
});
exports.getCommunitySubscriberCount = (request, response) => __awaiter(this, void 0, void 0, function* () {
    try {
        const req = request.body;
        const col = db_1.default.interlopers;
        const result = {};
        (yield col
            .aggregate([
            {
                $match: {
                    communityId: {
                        $in: req.ids.map((id) => new bson_1.ObjectID(id))
                    }
                }
            },
            {
                $group: {
                    _id: 'communityId',
                    count: { $sum: 1 }
                }
            }
        ])
            .toArray()).forEach((e) => {
            result[e._id.toHexString()] = e.count;
        });
        const resp = {
            code: index_1.code.success,
            data: result
        };
        response.json(resp);
    }
    catch (error) {
        logger_1.default.error(error);
        response.json({ code: index_1.code.error, msg: 'error' });
    }
});
exports.subscribeCommunity = (request, response) => __awaiter(this, void 0, void 0, function* () {
    const req = request.body;
    const me = request.body._self_state_user;
    const interloper = {
        _id: undefined,
        communityId: new bson_1.ObjectID(req.id),
        userId: me._id,
        interlopedTime: new Date().getTime()
    };
    delete interloper._id;
    try {
        const col = db_1.default.interlopers;
        yield col.insertOne(interloper);
        response.json({ code: index_1.code.success });
    }
    catch (error) {
        logger_1.default.error(error);
        response.json({ code: index_1.code.error, msg: 'error' });
    }
});
//# sourceMappingURL=community.js.map