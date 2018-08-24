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
function createPost(post) {
    return __awaiter(this, void 0, void 0, function* () {
        yield db_1.default.runInTransaction((session) => __awaiter(this, void 0, void 0, function* () {
            const posts = db_1.default.posts;
            const cntResult = yield posts
                .aggregate([{ $project: { slug: 1 } }, { $match: { slug: { $regex: `^${post.slug}\d*$` } } }, { $count: 'cnt' }], { session })
                .toArray();
            const cnt = cntResult.length === 0 ? 0 : cntResult[0].cnt;
            if (cnt !== 0) {
                post.slug += cnt;
            }
            post._id = (yield posts.insertOne(post, { session })).insertedId;
        }));
        return post;
    });
}
exports.createPost = createPost;
function getPostsByIds(ids) {
    return __awaiter(this, void 0, void 0, function* () {
        const posts = db_1.default.posts;
        return posts.find({ _id: { $in: ids } }).toArray();
    });
}
exports.getPostsByIds = getPostsByIds;
//# sourceMappingURL=post.js.map