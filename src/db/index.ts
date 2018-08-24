import { MongoClient, Db, MongoCallback, CollectionCreateOptions, Collection, IndexOptions } from 'mongodb';
import { MongoConnection } from '../types/config';
import * as assert from 'assert';
import 'ioredis';
import { Post, PostSchema } from './model';
import Redis = require('ioredis');
import {
	User,
	UserSchema,
	Community,
	CommunitySchema,
	Interloper,
	InterloperSchema,
	Follow,
	FollowSchema
} from './model';
import * as path from 'path';
import logger from '../logger';

interface ClientSession {
	startTransaction(options: TxOptions): Promise<void>;
	abortTransaction(): Promise<void>;
	commitTransaction(): Promise<void>;
}

interface TxOptions {
	readConcern?: { level?: 'local' | 'available' | 'majority' | 'linearizable' | 'snapshot' };
	writeConcern?: { w?: number | 'majority' | string; j?: boolean; wtimeout?: number };
	readPreference?: any;
}

const config = require(path.normalize('../../config/index.js'));

const mongoConn: MongoConnection = config.mongoConnection;
const redisConnectionOption: Redis.RedisOptions = config.redisConnectionOption;

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

let client: MongoClient;
let db: Db;

const connectCallback: MongoCallback<MongoClient> = async (err, clnt) => {
	if (err) {
		assert.equal(null, err);
	}
	let users: Collection<User>;
	let communities: Collection<Community>;
	let interlopers: Collection<Interloper>;
	let follows: Collection<Follow>;
	client = clnt;
	db = client.db('reddit');
	// create users if not exists
	db.collection<User>('users', { strict: true }, async (err, col) => {
		if (err) {
			users = await db.createCollection<User>('users', {
				validator: {
					$jsonSchema: UserSchema
				},
				validationLevel: 'strict',
				validationAction: 'error'
			} as CollectionCreateOptions);
		} else {
			await db.command({
				collMod: 'users',
				validator: {
					$jsonSchema: UserSchema
				},
				validationLevel: 'strict',
				validationAction: 'error'
			});
			users = col;
		}
		if (!await users.indexExists('users_username_index')) {
			await users.createIndex(
				{
					username: 1
				},
				{
					unique: true,
					name: 'users_username_index'
				}
			);
		}
		if (!await users.indexExists('users_email_index')) {
			await users.createIndex(
				{
					email: 1
				},
				{
					unique: true,
					name: 'users_email_index'
				}
			);
		}
	});
	db.collection<Community>('communities', { strict: true }, async (err, col) => {
		if (err) {
			communities = await db.createCollection<Community>('communities', {
				validator: {
					$jsonSchema: CommunitySchema
				},
				validationLevel: 'strict',
				validationAction: 'error'
			} as CollectionCreateOptions);
		} else {
			await db.command({
				collMod: 'communities',
				validator: {
					$jsonSchema: CommunitySchema
				},
				validationLevel: 'strict',
				validationAction: 'error'
			});
			communities = col;
		}
		if (!await communities.indexExists('communities_name_index')) {
			await communities.createIndex(
				{ name: 1 },
				{
					unique: true,
					name: 'communities_name_index'
				}
			);
		}
	});
	db.collection<Interloper>('interlopers', { strict: true }, async (err, col) => {
		if (err) {
			interlopers = await db.createCollection<Interloper>('interlopers', {
				validator: {
					$jsonSchema: InterloperSchema
				},
				validationAction: 'error',
				validationLevel: 'strict'
			} as CollectionCreateOptions);
		} else {
			await db.command({
				collMod: 'interlopers',
				validator: {
					$jsonSchema: InterloperSchema
				},
				validationLevel: 'strict',
				validationAction: 'error'
			});
			interlopers = col;
		}
		if (!await interlopers.indexExists('interlopers_communityId_index')) {
			await interlopers.createIndex({ communityId: 1 });
		}
		if (!await interlopers.indexExists('interlopers_userId_index')) {
			await interlopers.createIndex({ userId: 1 });
		}
	});
	db.collection<Follow>('follows', { strict: true }, async (err, col) => {
		if (err) {
			follows = await db.createCollection<Follow>('follows', {
				validator: {
					$jsonSchema: FollowSchema
				},
				validationAction: 'error',
				validationLevel: 'strict'
			} as CollectionCreateOptions);
		} else {
			await db.command({
				collMod: 'follows',
				validator: {
					$jsonSchema: FollowSchema
				},
				validationLevel: 'strict',
				validationAction: 'error'
			});
			follows = col;
		}
		if (!await follows.indexExists('follows_myId_index')) {
			await follows.createIndex({ myId: 1 });
		}
		if (!await follows.indexExists('follows_otherId_index')) {
			await follows.createIndex({ otherId: 1 });
		}
	});
	db.collection<Post>('posts', { strict: true }, async (err, col) => {
		if (err) {
			col = await db.createCollection('posts', {
				validator: {
					$jsonSchema: PostSchema
				},
				validationAction: 'error',
				validationLevel: 'strict'
			} as CollectionCreateOptions);
		} else {
			await db.command({
				collMod: 'posts',
				validator: {
					$jsonSchema: PostSchema
				},
				validationLevel: 'strict',
				validationAction: 'error'
			});
		}
		if (!await col.indexExists('posts_slug_index')) {
			await col.createIndex(
				{
					slug: 1
				},
				{ name: 'posts_slug_index', unique: true }
			);
		}
		if (!await col.indexExists('posts_authorId_index')) {
			await col.createIndex(
				{
					authorId: 1
				},
				{ name: 'posts_authorId_index' }
			);
		}
		if (!await col.indexExists('posts_title_content_index')) {
			await col.createIndex(
				{
					title: 'text',
					content: 'text'
				},
				{ name: 'posts_title_content_index' } as IndexOptions
			);
		}
		// if (!await col.indexExists('posts_content_index')) {
		// 	await col.createIndex(
		// 		{
		// 			content: 'text'
		// 		},
		// 		{ name: 'posts_content_index' }
		// 	);
		// }
		if (!await col.indexExists('posts_createBy_index')) {
			await col.createIndex(
				{
					createBy: 1
				},
				{ name: 'posts_createBy_index' }
			);
		}
		if (!await col.indexExists('posts_communityId_index')) {
			await col.createIndex(
				{
					communityId: 1
				},
				{ name: 'posts_communityId_index' }
			);
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
	});
};

if (mongoConn.connectClientOption) {
	MongoClient.connect(url, mongoConn.connectClientOption, connectCallback);
} else {
	MongoClient.connect(url, connectCallback);
}

const redisdb: Redis.Redis = new Redis(redisConnectionOption);

class RedditDB {
	get mongoClient(): MongoClient {
		return client;
	}
	// factory of databases and collections
	get mongodb(): Db {
		return db;
	}
	get users(): Collection<User> {
		return db.collection('users');
	}
	get communities(): Collection<Community> {
		return db.collection('communities');
	}
	get interlopers(): Collection<Interloper> {
		return db.collection('interlopers');
	}
	get follows(): Collection<Follow> {
		return db.collection('follows');
	}
	get posts(): Collection<Post> {
		return db.collection('posts');
	}
	get redisdb(): Redis.Redis {
		return redisdb;
	}

	// http://mongodb.github.io/node-mongodb-native/3.1/api/global.html#TransactionOptionsObject
	async runInTransaction(
		func: (session: any) => Promise<void>,
		options: TxOptions = {
			readConcern: { level: 'snapshot' },
			writeConcern: { w: 'majority' }
		}
	) {
		const session: ClientSession = client.startSession(options) as any;
		session.startTransaction(options);
		await runTransactionWithRetry(func, session);

		async function commitWithRetry(session: ClientSession) {
			try {
				await session.commitTransaction();
				console.log('Transaction committed.');
			} catch (error) {
				if (error.errorLabels && error.errorLabels.indexOf('UnknownTransactionCommitResult') < 0) {
					console.log('UnknownTransactionCommitResult, retrying commit operation ...');
					await commitWithRetry(session);
				} else {
					console.log('Error during commit ...');
					throw error;
				}
			}
		}

		async function runTransactionWithRetry(
			txnFunc: (session: ClientSession) => Promise<void>,
			session: ClientSession
		) {
			try {
				await txnFunc(session);
				await commitWithRetry(session);
			} catch (error) {
				console.log('Transaction aborted. Caught exception during transaction.', error.toString());
				logger.error(error.toString()); 
				// If transient error, retry the whole transaction
				if (error.errorLabels && error.errorLabels.indexOf('TransientTransactionError') < 0) {
					console.log('TransientTransactionError, retrying transaction ...');
					await runTransactionWithRetry(txnFunc, session);
				} else {
					throw error;
				}
			}
		}
	}
}

export default new RedditDB();
