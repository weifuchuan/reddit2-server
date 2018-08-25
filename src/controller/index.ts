import { IRouter } from 'express-serve-static-core';
import { RequestHandler } from 'express';
import {
	login,
	register,
	auth,
	confirmEmail,
	refreshToken,
	authMiddleware,
	getUserInfo,
	getSubscribedCommunities
} from './user';
import { createPost, getPostByIds, getAllPostByNew, feelPost, commentPost, deletePost } from './post';
import { uploadMedia } from './file';
import {
	getCommunitiesInfo,
	getCommunitySubscriberCount,
	subscribeCommunity,
	getTrendingCommunities,
	unsubscribeCommunity
} from './community';
const fileUpload = require('express-fileupload');

export default function setRouter(router: IRouter) {
	routeGroup('', [
		{
			path: '/login',
			handler: login
		},
		{
			path: '/reg',
			handler: register
		},
		{
			path: '/auth',
			handler: auth
		},
		{
			path: '/confirm-email',
			handler: confirmEmail
		},
		{
			path: '/refresh-token',
			handler: refreshToken
		}
	]);

	routeGroup(
		'/post',
		[
			{
				path: '/create',
				handler: createPost
			},
			{
				path: '/feel',
				handler: feelPost
			},
			{
				path: '/comment',
				handler: commentPost
			},
			{
				path: '/delete',
				handler: deletePost
			}
		],
		authMiddleware
	);

	routeGroup('/media', [
		{
			path: '/upload',
			handler: uploadMedia,
			middlewares: [
				authMiddleware,
				fileUpload({
					limits: {
						fileSize: 52428800, // <= 50MB
						fieldNameSize: 1024 // <= 1KB
					},
					abortOnLimit: true // Returns a HTTP 413 when the file is bigger
				})
			]
		}
	]);

	routeGroup('/community', [
		{
			path: '/get-infos',
			handler: getCommunitiesInfo
		},
		{
			path: '/subscriber/count',
			handler: getCommunitySubscriberCount
		},
		{
			path: '/trending',
			handler: getTrendingCommunities
		}
	]);

	routeGroup(
		'/community',
		[
			{
				path: '/subscribe',
				handler: subscribeCommunity
			},
			{
				path: '/unsubscribe',
				handler: unsubscribeCommunity
			}
		],
		authMiddleware
	);

	routeGroup('/post/get', [
		{
			path: '/ids',
			handler: getPostByIds
		},
		{
			path: '/all/new',
			handler: getAllPostByNew
		}
	]);

	routeGroup('/user', [
		{ path: '/get-info', handler: getUserInfo },
		{ path: '/subscribed-community', handler: getSubscribedCommunities }
	]);

	function routeGroup(
		group: string,
		ps: {
			path: string;
			handler: RequestHandler;
			middlewares?: RequestHandler[];
		}[],
		...middlewares: RequestHandler[]
	) {
		ps.forEach((p) => {
			router.post(`${group}${p.path}`, ...middlewares, ...(p.middlewares ? p.middlewares : []), p.handler);
		});
	}
}
