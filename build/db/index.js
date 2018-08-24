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
const mongodb_1 = require("mongodb");
const assert = require("assert");
require("ioredis");
const model_1 = require("./model");
const Redis = require("ioredis");
const model_2 = require("./model");
const path = require("path");
const logger_1 = require("../logger");
const config = require(path.normalize('../../config/index.js'));
const mongoConn = config.mongoConnection;
const redisConnectionOption = config.redisConnectionOption;
// mongodb://[username:password@]host1[:port1][,host2[:port2],...[,hostN[:portN]]][/[database][?options]]
const url = `mongodb://${mongoConn.username ? `${mongoConn.username}:${mongoConn.password}` : ''}${mongoConn.url
    .host}:${mongoConn.url.port ? mongoConn.url.port : 27017}${mongoConn.otherUrls
    ? mongoConn.otherUrls
        .map((url) => `,${url.host}:${url.port ? url.port : 27017}`)
        .reduce((prev, curr) => prev + curr, '')
    : ''}${mongoConn.options
    ? `/?${mongoConn.options
        .map((opt) => `${opt.name.trim()}=${opt.value.trim()}`)
        .reduce((prev, curr, currIndex) => `${currIndex === 0 ? `${prev}${curr}` : `${prev}&${curr}`}`, '')}`
    : ''}`;
// const url = `mongodb://${mongoConn.username ? `${mongoConn.username}:${mongoConn.password}` : ''}${mongoConn.url
// 	.host}:${mongoConn.url.port ? mongoConn.url.port : 27017}${mongoConn.options
// 	? `/?${mongoConn.options
// 			.map((opt) => `${opt.name.trim()}:${opt.value.trim()}`)
// 			.reduce((prev, curr, currIndex) => `${currIndex === 0 ? `${prev}${curr}` : `${prev}&${curr}`}`, '')}`
// 	: ''}`;
let client;
let db;
const connectCallback = (err, clnt) => __awaiter(this, void 0, void 0, function* () {
    if (err) {
        assert.equal(null, err);
    }
    let users;
    let communities;
    let interlopers;
    let follows;
    client = clnt;
    db = client.db('reddit');
    // create users if not exists
    db.collection('users', { strict: true }, (err, col) => __awaiter(this, void 0, void 0, function* () {
        if (err) {
            users = yield db.createCollection('users', {
                validator: {
                    $jsonSchema: model_2.UserSchema
                },
                validationLevel: 'strict',
                validationAction: 'error'
            });
        }
        else {
            yield db.command({
                collMod: 'users',
                validator: {
                    $jsonSchema: model_2.UserSchema
                },
                validationLevel: 'strict',
                validationAction: 'error'
            });
            users = col;
        }
        if (!(yield users.indexExists('users_username_index'))) {
            yield users.createIndex({
                username: 1
            }, {
                unique: true,
                name: 'users_username_index'
            });
        }
        if (!(yield users.indexExists('users_email_index'))) {
            yield users.createIndex({
                email: 1
            }, {
                unique: true,
                name: 'users_email_index'
            });
        }
    }));
    db.collection('communities', { strict: true }, (err, col) => __awaiter(this, void 0, void 0, function* () {
        if (err) {
            communities = yield db.createCollection('communities', {
                validator: {
                    $jsonSchema: model_2.CommunitySchema
                },
                validationLevel: 'strict',
                validationAction: 'error'
            });
        }
        else {
            yield db.command({
                collMod: 'communities',
                validator: {
                    $jsonSchema: model_2.CommunitySchema
                },
                validationLevel: 'strict',
                validationAction: 'error'
            });
            communities = col;
        }
        if (!(yield communities.indexExists('communities_name_index'))) {
            yield communities.createIndex({ name: 1 }, {
                unique: true,
                name: 'communities_name_index'
            });
        }
    }));
    db.collection('interlopers', { strict: true }, (err, col) => __awaiter(this, void 0, void 0, function* () {
        if (err) {
            interlopers = yield db.createCollection('interlopers', {
                validator: {
                    $jsonSchema: model_2.InterloperSchema
                },
                validationAction: 'error',
                validationLevel: 'strict'
            });
        }
        else {
            yield db.command({
                collMod: 'interlopers',
                validator: {
                    $jsonSchema: model_2.InterloperSchema
                },
                validationLevel: 'strict',
                validationAction: 'error'
            });
            interlopers = col;
        }
        if (!(yield interlopers.indexExists('interlopers_communityId_index'))) {
            yield interlopers.createIndex({ communityId: 1 });
        }
        if (!(yield interlopers.indexExists('interlopers_userId_index'))) {
            yield interlopers.createIndex({ userId: 1 });
        }
    }));
    db.collection('follows', { strict: true }, (err, col) => __awaiter(this, void 0, void 0, function* () {
        if (err) {
            follows = yield db.createCollection('follows', {
                validator: {
                    $jsonSchema: model_2.FollowSchema
                },
                validationAction: 'error',
                validationLevel: 'strict'
            });
        }
        else {
            yield db.command({
                collMod: 'follows',
                validator: {
                    $jsonSchema: model_2.FollowSchema
                },
                validationLevel: 'strict',
                validationAction: 'error'
            });
            follows = col;
        }
        if (!(yield follows.indexExists('follows_myId_index'))) {
            yield follows.createIndex({ myId: 1 });
        }
        if (!(yield follows.indexExists('follows_otherId_index'))) {
            yield follows.createIndex({ otherId: 1 });
        }
    }));
    db.collection('posts', { strict: true }, (err, col) => __awaiter(this, void 0, void 0, function* () {
        if (err) {
            col = yield db.createCollection('posts', {
                validator: {
                    $jsonSchema: model_1.PostSchema
                },
                validationAction: 'error',
                validationLevel: 'strict'
            });
        }
        else {
            yield db.command({
                collMod: 'posts',
                validator: {
                    $jsonSchema: model_1.PostSchema
                },
                validationLevel: 'strict',
                validationAction: 'error'
            });
        }
        if (!(yield col.indexExists('posts_slug_index'))) {
            yield col.createIndex({
                slug: 1
            }, { name: 'posts_slug_index', unique: true });
        }
        if (!(yield col.indexExists('posts_authorId_index'))) {
            yield col.createIndex({
                authorId: 1
            }, { name: 'posts_authorId_index' });
        }
        if (!(yield col.indexExists('posts_title_content_index'))) {
            yield col.createIndex({
                title: 'text',
                content: 'text'
            }, { name: 'posts_title_content_index' });
        }
        // if (!await col.indexExists('posts_content_index')) {
        // 	await col.createIndex(
        // 		{
        // 			content: 'text'
        // 		},
        // 		{ name: 'posts_content_index' }
        // 	);
        // }
        if (!(yield col.indexExists('posts_createBy_index'))) {
            yield col.createIndex({
                createBy: 1
            }, { name: 'posts_createBy_index' });
        }
        if (!(yield col.indexExists('posts_communityId_index'))) {
            yield col.createIndex({
                communityId: 1
            }, { name: 'posts_communityId_index' });
        }
        // if (!await col.indexExists('posts_id_comments_authorId_createBy_index')) {
        // 	await col.createIndex(
        // 		{
        // 			_id: 1,
        // 			'comments.authorId': 1,
        // 			'comments.createBy': 1
        // 		},
        // 		{
        // 			name: 'posts_id_comments_authorId_createBy_index'
        // 		}
        // 	);
        // }
    }));
});
if (mongoConn.connectClientOption) {
    mongodb_1.MongoClient.connect(url, mongoConn.connectClientOption, connectCallback);
}
else {
    mongodb_1.MongoClient.connect(url, connectCallback);
}
const redisdb = new Redis(redisConnectionOption);
class RedditDB {
    get mongoClient() {
        return client;
    }
    // factory of databases and collections
    get mongodb() {
        return db;
    }
    get users() {
        return db.collection('users');
    }
    get communities() {
        return db.collection('communities');
    }
    get interlopers() {
        return db.collection('interlopers');
    }
    get follows() {
        return db.collection('follows');
    }
    get posts() {
        return db.collection('posts');
    }
    get redisdb() {
        return redisdb;
    }
    // http://mongodb.github.io/node-mongodb-native/3.1/api/global.html#TransactionOptionsObject
    runInTransaction(func, options = {
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' }
    }) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = client.startSession(options);
            session.startTransaction(options);
            yield runTransactionWithRetry(func, session);
            function commitWithRetry(session) {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        yield session.commitTransaction();
                        console.log('Transaction committed.');
                    }
                    catch (error) {
                        if (error.errorLabels && error.errorLabels.indexOf('UnknownTransactionCommitResult') < 0) {
                            console.log('UnknownTransactionCommitResult, retrying commit operation ...');
                            yield commitWithRetry(session);
                        }
                        else {
                            console.log('Error during commit ...');
                            throw error;
                        }
                    }
                });
            }
            function runTransactionWithRetry(txnFunc, session) {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        yield txnFunc(session);
                        yield commitWithRetry(session);
                    }
                    catch (error) {
                        console.log('Transaction aborted. Caught exception during transaction.', error.toString());
                        logger_1.default.error(error.toString());
                        // If transient error, retry the whole transaction
                        if (error.errorLabels && error.errorLabels.indexOf('TransientTransactionError') < 0) {
                            console.log('TransientTransactionError, retrying transaction ...');
                            yield runTransactionWithRetry(txnFunc, session);
                        }
                        else {
                            throw error;
                        }
                    }
                });
            }
        });
    }
}
exports.default = new RedditDB();
//# sourceMappingURL=index.js.map