import * as dao from '../dao/community';
import { RequestHandler } from 'express';
import {
	GetCommunitiesInfoReq,
	GetCommunitiesInfoResp,
	code,
	GetCommunitySubscriberCountReq,
	GetCommunitySubscriberCountResp
} from '../common/api/index';
import { ObjectID } from 'bson';
import { User, Interloper } from '../db/model';
import db from '../db';
import logger from '../logger';
import { SubscribeCommunityReq } from '../common/api/community';

export const getCommunitiesInfo: RequestHandler = async (req, resp) => {
	const { ids }: GetCommunitiesInfoReq = req.body;
	try {
		const comms = await dao.getCommunities(ids.map((id) => new ObjectID(id)));
		const respJson: GetCommunitiesInfoResp = {
			code: code.success,
			communities: comms.map((comm) => ({
				...comm,
				_id: comm._id.toHexString()
			}))
		};
		resp.json(respJson);
	} catch (err) {
		resp.json({ code: code.error, msg: 'inner server error' });
	}
};

export const getCommunitySubscriberCount: RequestHandler = async (request, response) => {
	try {
		const req: GetCommunitySubscriberCountReq = request.body;
		const col = db.interlopers;
		const result: { [id: string]: number } = {};
		(await col
			.aggregate<{ _id: ObjectID; count: number }>([
				{
					$match: {
						communityId: {
							$in: req.ids.map((id) => new ObjectID(id))
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
		const resp: GetCommunitySubscriberCountResp = {
			code: code.success,
			data: result
		};
		response.json(resp);
	} catch (error) {
		logger.error(error);
		response.json({ code: code.error, msg: 'error' });
	}
};

export const subscribeCommunity: RequestHandler = async (request, response) => {
	const req: SubscribeCommunityReq = request.body;
	const me: User = request.body._self_state_user;
	const interloper: Interloper = {
		_id: undefined as any,
		communityId: new ObjectID(req.id),
		userId: me._id,
		interlopedTime: new Date().getTime()
	};
	delete (interloper as any)._id;
	try {
		const col = db.interlopers;
		await col.insertOne(interloper);
		response.json({ code: code.success });
	} catch (error) {
		logger.error(error);
		response.json({ code: code.error, msg: 'error' });
	}
};
