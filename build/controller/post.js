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
const index_1 = require("../common/api/index");
const pinyin = require("pinyin");
const bson_1 = require("bson");
const dao = require("../dao/post");
const logger_1 = require("../logger");
const db_1 = require("../db");
exports.createPost = (req, resp) => __awaiter(this, void 0, void 0, function* () {
    const user = req.body._self_state_user;
    const reqData = req.body;
    const slug = pinyin(reqData.title, { style: pinyin.STYLE_NORMAL })
        .map((word) => word[0].trim().replace(/\s+/g, '_'))
        .reduce((prev, curr) => prev + '-' + curr);
    let post = {
        _id: undefined,
        slug,
        authorId: user._id,
        title: reqData.title,
        content: reqData.content,
        kid: reqData.kid,
        tags: reqData.tags,
        createAt: reqData.createAt,
        modifyAt: reqData.createAt,
        likeCount: 0,
        nayCount: 0,
        comments: []
    };
    if (reqData.communityId) {
        post.communityId = new bson_1.ObjectID(reqData.communityId);
    }
    try {
        post = yield dao.createPost(post);
        const respJson = {
            code: index_1.code.success,
            _id: post._id.toHexString(),
            slug: post.slug
        };
        resp.json(respJson);
    }
    catch (e) {
        logger_1.default.error(e.toString());
        resp.json({ code: index_1.code.error, msg: '创建失败' });
    }
});
exports.getPostByIds = (request, response) => __awaiter(this, void 0, void 0, function* () {
    const req = request.body;
    try {
        const posts = yield dao.getPostsByIds(req.ids.map((id) => new bson_1.ObjectID(id)));
        const resp = {
            code: index_1.code.success,
            // danger: After JSON is serialized, ObjectID will be converted to string type.
            posts: posts
        };
        if (req.getterId) {
            const getterLikePosts = [];
            const getterNayPosts = [];
            const redis = db_1.default.redisdb;
            for (const post of posts) {
                if ((yield redis.sismember(`post:like:${post._id.toHexString()}`, req.getterId)) === 1) {
                    getterLikePosts.push(post._id.toHexString());
                }
                if ((yield redis.sismember(`post:nay:${post._id.toHexString()}`, req.getterId)) === 1) {
                    getterNayPosts.push(post._id.toHexString());
                }
            }
            resp.getterLikePosts = getterLikePosts;
            resp.getterNayPosts = getterNayPosts;
        }
        response.json(resp);
    }
    catch (error) {
        logger_1.default.error(error);
        response.json({ code: index_1.code.error, msg: 'inner server error' });
    }
});
exports.getAllPostByNew = (request, response) => __awaiter(this, void 0, void 0, function* () {
    const req = request.body;
    const resp = {
        code: index_1.code.success,
        posts: []
    };
    let lastCreateAt = req.lastCreateAt ? req.lastCreateAt : new Date().getTime();
    let count = req.count ? req.count : 10;
    let justId = req.justId ? req.justId : false;
    const col = db_1.default.posts;
    try {
        if (justId) {
            resp.posts = (yield col
                .aggregate([
                { $project: { _id: 1, createAt: 1 } },
                { $match: { createAt: { $lt: lastCreateAt } } },
                { $sort: { createAt: -1 } },
                { $limit: count },
                { $project: { _id: 1 } }
            ])
                .toArray()).map((post) => post._id.toHexString());
        }
        else {
            resp.posts = (yield col
                .aggregate([
                { $match: { createAt: { $lt: lastCreateAt } } },
                { $sort: { createAt: -1 } },
                { $limit: count }
            ])
                .toArray()).map((post) => (Object.assign({}, post, { _id: post._id.toHexString(), authorId: post.authorId.toHexString(), communityId: post.communityId ? post.communityId.toHexString() : undefined, comments: post.comments })));
        }
        if (req.getterId) {
            const getterLikePosts = [];
            const getterNayPosts = [];
            const redis = db_1.default.redisdb;
            if (req.justId) {
                for (const id of resp.posts) {
                    if ((yield redis.sismember(`post:like:${id}`, req.getterId)) === 1) {
                        getterLikePosts.push(id);
                    }
                    if ((yield redis.sismember(`post:nay:${id}`, req.getterId)) === 1) {
                        getterNayPosts.push(id);
                    }
                }
            }
            else {
                for (const post of resp.posts) {
                    if ((yield redis.sismember(`post:like:${post._id}`, req.getterId)) === 1) {
                        getterLikePosts.push(post._id);
                    }
                    if ((yield redis.sismember(`post:nay:${post._id}`, req.getterId)) === 1) {
                        getterNayPosts.push(post._id);
                    }
                }
            }
            resp.getterLikePosts = getterLikePosts;
            resp.getterNayPosts = getterNayPosts;
        }
    }
    catch (error) {
        logger_1.default.error(error);
        resp.code = index_1.code.error;
        resp.msg = 'inner server error';
    }
    response.json(resp);
});
exports.getPostByPopular = (request, response) => __awaiter(this, void 0, void 0, function* () {
    const req = request.body;
});
const timeLimit = 1000 * 60 * 60 * 24 * 7; // one week
exports.feelPost = (request, response) => __awaiter(this, void 0, void 0, function* () {
    try {
        const col = db_1.default.posts;
        const redis = db_1.default.redisdb;
        const me = request.body._self_state_user;
        const meId = me._id.toHexString();
        const req = request.body;
        const post = yield col.findOne({ _id: new bson_1.ObjectID(req.id) }, { fields: { _id: 1, createAt: 1 } });
        if (!post || new Date().getTime() - post.createAt > timeLimit) {
            response.status(500).end('');
            return;
        }
        const likeSetKey = `post:like:${post._id.toHexString()}`;
        const naySetKey = `post:nay:${post._id.toHexString()}`;
        const exists = (yield redis.exists(likeSetKey)) === 1;
        const likeOld = (yield redis.sismember(likeSetKey, meId)) === 1;
        const nayOld = (yield redis.sismember(naySetKey, meId)) === 1;
        if (req.action === 'like') {
            if (!likeOld) {
                yield redis.sadd(likeSetKey, meId);
                yield col.updateOne({ _id: post._id }, { $inc: { likeCount: 1 } });
                if (nayOld) {
                    yield redis.srem(naySetKey, meId);
                    yield col.updateOne({ _id: post._id }, { $inc: { nayCount: -1 } });
                }
                if (!exists) {
                    yield redis.expire(likeSetKey, Math.floor((post.createAt + timeLimit - new Date().getTime()) / 1000));
                }
            }
        }
        else if (req.action === 'nay') {
            if (!nayOld) {
                yield redis.sadd(naySetKey, meId);
                yield col.updateOne({ _id: post._id }, { $inc: { nayCount: 1 } });
                if (likeOld) {
                    yield redis.srem(likeSetKey, meId);
                    yield col.updateOne({ _id: post._id }, { $inc: { likeCount: -1 } });
                }
                if (!exists) {
                    yield redis.expire(naySetKey, Math.floor((post.createAt + timeLimit - new Date().getTime()) / 1000));
                }
            }
        }
        else {
            if (likeOld) {
                yield redis.srem(likeSetKey, meId);
                yield col.updateOne({ _id: post._id }, { $inc: { likeCount: -1 } });
            }
            if (nayOld) {
                yield redis.srem(naySetKey, meId);
                yield col.updateOne({ _id: post._id }, { $inc: { nayCount: -1 } });
            }
        }
        if (req.action === 'like' && likeOld) {
            response.json({ code: index_1.code.error, msg: '已赞过了' });
        }
        else if (req.action === 'nay' && nayOld) {
            response.json({ code: index_1.code.error, msg: '已踩过了' });
        }
        else {
            response.json({ code: index_1.code.success });
        }
    }
    catch (err) {
        logger_1.default.error(err);
        response.json({ code: index_1.code.error, msg: 'inner server error' });
    }
});
exports.commentPost = (request, response) => __awaiter(this, void 0, void 0, function* () {
    const req = request.body;
    const resp = { code: index_1.code.success };
    const me = request.body._self_state_user;
    if (me._id.toHexString() !== req.comment.authorId) {
        response.status(500).end();
        return;
    }
    const posts = db_1.default.posts;
    let selector = 'comments';
    for (let i of req.indexes) {
        selector += `.${i}.comments`;
    }
    try {
        const result = yield posts.updateOne({ _id: new bson_1.ObjectID(req.postId) }, {
            $push: {
                [selector]: {
                    $each: [Object.assign({}, req.comment, { authorId: new bson_1.ObjectID(req.comment.authorId) })],
                    $sort: { createAt: -1 }
                }
            }
        });
    }
    catch (err) {
        logger_1.default.error(err);
        resp.code = index_1.code.error;
        resp.msg = '评论失败';
    }
    response.json(resp);
});
exports.deletePost = (request, response) => __awaiter(this, void 0, void 0, function* () {
    const req = request.body;
    const me = request.body._self_state_user;
    const posts = db_1.default.posts;
    try {
        yield posts.remove({ _id: new bson_1.ObjectID(req.id), authorId: me._id });
        response.json({ code: index_1.code.success });
    }
    catch (err) {
        response.json({ code: index_1.code.error, msg: '删除失败' });
        logger_1.default.error(err);
    }
});
//# sourceMappingURL=post.js.map