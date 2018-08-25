import { RequestHandler } from 'express';
import { User, Post } from '../db/model';
import {
	CreatePostReq,
	CreatePostResp,
	code,
	Resp,
	GetPostByIdsReq,
	GetPostByIdsResp,
	FeelPostReq
} from '../common/api/index';
import { Post as Post2, Comment as Comment2 } from '../common/model/index';
import { Comment } from '../db/model';
import * as pinyin from 'pinyin';
import { ObjectID } from 'bson';
import * as dao from '../dao/post';
import logger from '../logger';
import { GetAllPostByNewReq, GetAllPostByNewResp } from '../common/api/index';
import db from '../db';
import { CommentPostReq, DeletePostReq, GetPostByPopularReq } from '../common/api/post';
import { request } from 'https';
import { GetCommunitySubscriberCountReq } from '../common/api/community';

export const createPost: RequestHandler = async (req, resp) => {
	const user: User = req.body._self_state_user;
	const reqData: CreatePostReq = req.body;
	const slug = pinyin(reqData.title, { style: pinyin.STYLE_NORMAL })
		.map((word) => word[0].trim().replace(/\s+/g, '_'))
		.reduce((prev, curr) => prev + '-' + curr);
	let post: Post = {
		_id: undefined as any,
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
		post.communityId = new ObjectID(reqData.communityId);
	}
	try {
		post = await dao.createPost(post);
		const respJson: CreatePostResp = {
			code: code.success,
			_id: post._id.toHexString(),
			slug: post.slug
		};
		resp.json(respJson);
	} catch (e) {
		logger.error(e.toString());
		resp.json({ code: code.error, msg: '创建失败' } as Resp);
	}
};

export const getPostByIds: RequestHandler = async (request, response) => {
	const req = request.body as GetPostByIdsReq;
	try {
		const posts = await dao.getPostsByIds(req.ids.map((id) => new ObjectID(id)));
		const resp: GetPostByIdsResp = {
			code: code.success,
			// danger: After JSON is serialized, ObjectID will be converted to string type.
			posts: posts as any
		};
		if (req.getterId) {
			const getterLikePosts: string[] = [];
			const getterNayPosts: string[] = [];
			const redis = db.redisdb;
			for (const post of posts) {
				if ((await redis.sismember(`post:like:${post._id.toHexString()}`, req.getterId!)) === 1) {
					getterLikePosts.push(post._id.toHexString());
				}
				if ((await redis.sismember(`post:nay:${post._id.toHexString()}`, req.getterId!)) === 1) {
					getterNayPosts.push(post._id.toHexString());
				}
			}
			resp.getterLikePosts = getterLikePosts;
			resp.getterNayPosts = getterNayPosts;
		}
		response.json(resp);
	} catch (error) {
		logger.error(error);
		response.json({ code: code.error, msg: 'inner server error' });
	}
};

export const getAllPostByNew: RequestHandler = async (request, response) => {
	const req = request.body as GetAllPostByNewReq;
	const resp: GetAllPostByNewResp = {
		code: code.success,
		posts: []
	};
	let lastCreateAt = req.lastCreateAt ? req.lastCreateAt : new Date().getTime();
	let count = req.count ? req.count : 10;
	let justId = req.justId ? req.justId : false;
	const col = db.posts;
	try {
		if (justId) {
			resp.posts = (await col
				.aggregate([
					{ $project: { _id: 1, createAt: 1 } },
					{ $match: { createAt: { $lt: lastCreateAt } } },
					{ $sort: { createAt: -1 } },
					{ $limit: count },
					{ $project: { _id: 1 } }
				])
				.toArray()).map((post) => post._id.toHexString());
		} else {
			resp.posts = (await col
				.aggregate([
					{ $match: { createAt: { $lt: lastCreateAt } } },
					{ $sort: { createAt: -1 } },
					{ $limit: count }
				])
				.toArray()).map((post) => ({
				...post,
				_id: post._id.toHexString(),
				authorId: post.authorId.toHexString(),
				communityId: post.communityId ? post.communityId.toHexString() : undefined,
				comments: post.comments as any
			}));
		}
		if (req.getterId) {
			const getterLikePosts: string[] = [];
			const getterNayPosts: string[] = [];
			const redis = db.redisdb;
			if (req.justId) {
				for (const id of resp.posts as string[]) {
					if ((await redis.sismember(`post:like:${id}`, req.getterId!)) === 1) {
						getterLikePosts.push(id);
					}
					if ((await redis.sismember(`post:nay:${id}`, req.getterId!)) === 1) {
						getterNayPosts.push(id);
					}
				}
			} else {
				for (const post of resp.posts as Post2[]) {
					if ((await redis.sismember(`post:like:${post._id}`, req.getterId!)) === 1) {
						getterLikePosts.push(post._id);
					}
					if ((await redis.sismember(`post:nay:${post._id}`, req.getterId!)) === 1) {
						getterNayPosts.push(post._id);
					}
				}
			}
			resp.getterLikePosts = getterLikePosts;
			resp.getterNayPosts = getterNayPosts;
		}
	} catch (error) {
		logger.error(error);
		resp.code = code.error;
		resp.msg = 'inner server error';
	}
	response.json(resp);
};

export const getPostByPopular:RequestHandler=async (request, response)=>{
	const req:GetPostByPopularReq=request.body; 
	
}

const timeLimit = 1000 * 60 * 60 * 24 * 7; // one week

export const feelPost: RequestHandler = async (request, response) => {
	try {
		const col = db.posts;
		const redis = db.redisdb;
		const me = request.body._self_state_user as User;
		const meId = me._id.toHexString();
		const req: FeelPostReq = request.body;
		const post: Post | null = await col.findOne({ _id: new ObjectID(req.id) }, { fields: { _id: 1, createAt: 1 } });
		if (!post || new Date().getTime() - post.createAt > timeLimit) {
			response.status(500).end('');
			return;
		}
		const likeSetKey = `post:like:${post._id.toHexString()}`;
		const naySetKey = `post:nay:${post._id.toHexString()}`;
		const exists = (await redis.exists(likeSetKey)) === 1;
		const likeOld = (await redis.sismember(likeSetKey, meId)) === 1;
		const nayOld = (await redis.sismember(naySetKey, meId)) === 1;
		if (req.action === 'like') {
			if (!likeOld) {
				await redis.sadd(likeSetKey, meId);
				await col.updateOne({ _id: post._id }, { $inc: { likeCount: 1 } });
				if (nayOld) {
					await redis.srem(naySetKey, meId);
					await col.updateOne({ _id: post._id }, { $inc: { nayCount: -1 } });
				}
				if (!exists) {
					await redis.expire(
						likeSetKey,
						Math.floor((post!.createAt + timeLimit - new Date().getTime()) / 1000)
					);
				}
			}
		} else if (req.action === 'nay') {
			if (!nayOld) {
				await redis.sadd(naySetKey, meId);
				await col.updateOne({ _id: post._id }, { $inc: { nayCount: 1 } });
				if (likeOld) {
					await redis.srem(likeSetKey, meId);
					await col.updateOne({ _id: post._id }, { $inc: { likeCount: -1 } });
				}
				if (!exists) {
					await redis.expire(
						naySetKey,
						Math.floor((post!.createAt + timeLimit - new Date().getTime()) / 1000)
					);
				}
			}
		} else {
			if (likeOld) {
				await redis.srem(likeSetKey, meId);
				await col.updateOne({ _id: post._id }, { $inc: { likeCount: -1 } });
			}
			if (nayOld) {
				await redis.srem(naySetKey, meId);
				await col.updateOne({ _id: post._id }, { $inc: { nayCount: -1 } });
			}
		}
		if (req.action === 'like' && likeOld) {
			response.json({ code: code.error, msg: '已赞过了' });
		} else if (req.action === 'nay' && nayOld) {
			response.json({ code: code.error, msg: '已踩过了' });
		} else {
			response.json({ code: code.success });
		}
	} catch (err) {
		logger.error(err);
		response.json({ code: code.error, msg: 'inner server error' });
	}
};

export const commentPost: RequestHandler = async (request, response) => {
	const req: CommentPostReq = request.body;
	const resp: Resp = { code: code.success };
	const me: User = request.body._self_state_user;
	if (me._id.toHexString() !== req.comment.authorId) {
		response.status(500).end();
		return;
	}
	const posts = db.posts;
	let selector = 'comments';
	for (let i of req.indexes) {
		selector += `.${i}.comments`;
	}
	try {
		const result = await posts.updateOne(
			{ _id: new ObjectID(req.postId) },
			{
				$push: {
					[selector]: {
						$each: [ { ...req.comment, authorId: new ObjectID(req.comment.authorId) } ],
						$sort: { createAt: -1 }
					}
				}
			}
		);
	} catch (err) {
		logger.error(err);
		resp.code = code.error;
		resp.msg = '评论失败';
	}
	response.json(resp);
};

export const deletePost: RequestHandler = async (request, response) => {
	const req: DeletePostReq = request.body;
	const me: User = request.body._self_state_user;
	const posts = db.posts;
	try {
		await posts.remove({ _id: new ObjectID(req.id), authorId: me._id });
		response.json({ code: code.success });
	} catch (err) {
		response.json({ code: code.error, msg: '删除失败' });
		logger.error(err);
	}
};
