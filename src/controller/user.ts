import { RequestHandler } from 'express';
import { findUserByEmail, findUserByUsername, addUser, findUserById, emailExists } from '../dao/user';
import * as dao from '../dao/user';
import { User } from '../db/model';
import md5 = require('js-md5');
import jwt from '../kit/jwt';
import {
	LoginReq,
	LoginResp,
	code,
	Resp,
	RegReq,
	RegResp,
	ConfirmEmailReq,
	RefreshTokenResp,
	GetUserInfoResp
} from '../common/api/index';
import * as regexp from '../kit/regexp';
import { MongoError, ObjectID } from 'mongodb';
import logger from '../logger';
import db from '../db';
import { sendCode } from '../kit/email';
import { AuthResp, RefreshTokenReq, GetUserInfoReq } from '../common/api/index';
import { request } from 'https';
import { GetSubscribedCommunitiesReq, GetSubscribedCommunitiesResp } from '../common/api/user';

const randtoken = require('rand-token');
const rdb = db.redisdb;
const refreshTokensPrefix = 'refreshTokens';

export const login: RequestHandler = async (req, resp) => {
	const loginReq: LoginReq = req.body;
	loginReq.loginer = loginReq.loginer.trim();
	loginReq.password = loginReq.password.trim();
	let user: User;
	try {
		// is email
		if (/^[a-z0-9]+([._\\-]*[a-z0-9])*@([a-z0-9]+[-a-z0-9]*[a-z0-9]+.){1,63}[a-z0-9]+$/.test(loginReq.loginer)) {
			user = await findUserByEmail(loginReq.loginer);
		} else {
			// is username
			user = await findUserByUsername(loginReq.loginer);
		}
		if (user.password === md5(loginReq.password)) {
			user.password = '';
			const token = jwt.sign({ id: user._id.toHexString() });
			const refreshToken = randtoken.uid(256);
			rdb.setex(`${refreshTokensPrefix}:${refreshToken}`, 60 * 60 * 24 * 30, user._id.toHexString());
			const respJson: LoginResp = {
				code: code.success,
				token,
				refreshToken,
				user
			};
			resp.json(respJson).end();
		} else {
			throw '密码错误';
		}
	} catch (e) {
		resp.json({
			code: code.error,
			msg: e.toString()
		} as Resp);
	}
};

export const register: RequestHandler = async (req, resp) => {
	let { username, password, email }: RegReq = req.body;
	let c = req.body.code;
	username = username.trim();
	password = md5(password.trim());
	email = email.trim();
	c = c.trim();
	try {
		if (c !== (await rdb.get(`code:${email}`))) {
			throw '验证码错误';
		}
		if (!regexp.username.test(username)) {
			throw '用户名不合法';
		}
		if (!regexp.email.test(email)) {
			throw '邮箱不合法';
		}
		const user = await addUser(username, email, password);
		user.password = '';
		const refreshToken = randtoken.uid(256);
		rdb.setex(`${refreshTokensPrefix}:${refreshToken}`, 60 * 60 * 24 * 30, user._id.toHexString());
		const respJson: RegResp = {
			code: code.success,
			user,
			token: jwt.sign({ id: user._id.toHexString() }),
			refreshToken
		};
		resp.json(respJson);
	} catch (e) {
		let msg: string = e.toString();
		if (e instanceof MongoError) {
			logger.error(e);
			if (e.code === 11000) {
				msg = '用户名或邮箱已存在';
			} else if (e.code === 121) {
				msg = '数据未通过验证';
			} else {
				msg = '数据库错误';
			}
		}
		resp.json({
			code: code.error,
			msg
		} as Resp);
	}
};

export const auth: RequestHandler = async (req, resp) => {
	const authorization = req.header('Authorization');
	if (authorization && authorization.startsWith('Bearer ')) {
		const token = authorization.split(' ')[1];
		try {
			const data = jwt.verify(token);
			if (data.id) {
				try {
					const user = await findUserById(data.id);
					user.password = '';
					const respJson: AuthResp = {
						code: code.success,
						user
					};
					resp.json(respJson).end();
				} catch (e) {
					resp.json({
						code: code.error,
						msg: e.toString()
					} as Resp);
				}
			} else {
				resp.json({
					code: code.error,
					msg: 'no auth info'
				} as Resp);
			}
		} catch (error) {
			resp.json({
				code: code.error,
				msg: 'auth failed'
			} as Resp);
		}
	} else {
		resp.json({
			code: code.error,
			msg: 'no auth info'
		} as Resp);
	}
};

export const authMiddleware: RequestHandler = async (req, resp, next) => {
	const authorization = req.header('Authorization');
	if (authorization && authorization.startsWith('Bearer ')) {
		const token = authorization.split(' ')[1];
		let data: any;
		try {
			data = jwt.verify(token);
		} catch (e) {
			resp.json(<Resp>{
				code: code.noAuth
			});
			return;
		}
		if (data.id) {
			try {
				const user = await findUserById(data.id);
				req.body._self_state_user = user;
				next();
			} catch (e) {
				resp.json(<Resp>{
					code: code.noAuth
				});
			}
		} else {
			resp.json(<Resp>{
				code: code.noAuth
			});
		}
	} else {
		resp.json(<Resp>{
			code: code.noAuth
		});
	}
};

export const refreshToken: RequestHandler = async (req, resp) => {
	const { id, refreshToken } = req.body as RefreshTokenReq;
	if ((await rdb.get(`${refreshTokensPrefix}:${refreshToken}`)) === id.trim()) {
		const token = jwt.sign({ id });
		resp.json({ token } as RefreshTokenResp).end();
	} else {
		resp.status(401).end();
	}
};

export const confirmEmail: RequestHandler = async (req, resp) => {
	let { email } = req.body as ConfirmEmailReq;
	email = email.trim();
	if (regexp.email.test(email)) {
		const exst = await emailExists(email);
		if (exst) {
			resp.json({
				code: code.error,
				msg: '邮箱已存在'
			} as Resp);
			return;
		}
		let c = '';
		for (let i = 0; i < 4; i++) {
			c += Math.floor(Math.random() * 10);
		}
		try {
			await sendCode(email, c);
			rdb.setex(`code:${email}`, 60 * 20, c);
			await rdb.expire(`code:${email}`, 60 * 10);
			resp.json({
				code: code.success
			} as Resp);
		} catch (e) {
			logger.error(e);
			resp.json({
				code: code.error,
				msg: '发送失败'
			} as Resp);
		}
	} else {
		resp.json({
			code: code.error,
			msg: '邮箱格式错误'
		} as Resp);
	}
};

export const getUserInfo: RequestHandler = async (request, response) => {
	const req: GetUserInfoReq = request.body;
	try {
		const user = await findUserById(req.id);
		user.password = '';
		const resp: GetUserInfoResp = {
			code: code.success,
			user: {
				...user,
				_id: user._id.toHexString(),
				subscribedCommunities: user.subscribedCommunities.map((c) => c.toHexString())
			}
		};
		response.json(resp);
	} catch (err) {
		logger.error(err);
		response.json({ code: code.error, msg: 'get failed' });
	}
};

export const getSubscribedCommunities: RequestHandler = async (request, response) => {
	const req: GetSubscribedCommunitiesReq = request.body;
	const resp: GetSubscribedCommunitiesResp = { code: code.success, communityIds: [] };
	try {
		const col = db.interlopers;
		resp.communityIds = (await col.find({ userId: new ObjectID(req.userId) }).toArray()).map((e) => e.communityId.toHexString());
		response.json(resp);
	} catch (err) {
		logger.error(err);
		resp.code = code.error;
		resp.msg = 'error';
		response.json(resp);
	}
};
