"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = require("./user");
const post_1 = require("./post");
const file_1 = require("./file");
const community_1 = require("./community");
const fileUpload = require('express-fileupload');
function setRouter(router) {
    routeGroup('', [
        {
            path: '/login',
            handler: user_1.login
        },
        {
            path: '/reg',
            handler: user_1.register
        },
        {
            path: '/auth',
            handler: user_1.auth
        },
        {
            path: '/confirm-email',
            handler: user_1.confirmEmail
        },
        {
            path: '/refresh-token',
            handler: user_1.refreshToken
        }
    ]);
    routeGroup('/post', [
        {
            path: '/create',
            handler: post_1.createPost
        },
        {
            path: '/feel',
            handler: post_1.feelPost
        },
        {
            path: '/comment',
            handler: post_1.commentPost
        },
        {
            path: '/delete',
            handler: post_1.deletePost
        }
    ], user_1.authMiddleware);
    routeGroup('/media', [
        {
            path: '/upload',
            handler: file_1.uploadMedia,
            middlewares: [
                user_1.authMiddleware,
                fileUpload({
                    limits: {
                        fileSize: 52428800,
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
            handler: community_1.getCommunitiesInfo
        },
        {
            path: '/subscriber/count',
            handler: community_1.getCommunitySubscriberCount
        },
        {
            path: '/trending',
            handler: community_1.getTrendingCommunities
        }
    ]);
    routeGroup('/community', [
        {
            path: '/subscribe',
            handler: community_1.subscribeCommunity
        },
        {
            path: '/unsubscribe',
            handler: community_1.unsubscribeCommunity
        }
    ], user_1.authMiddleware);
    routeGroup('/post/get', [
        {
            path: '/ids',
            handler: post_1.getPostByIds
        },
        {
            path: '/all/new',
            handler: post_1.getAllPostByNew
        }
    ]);
    routeGroup('/user', [
        { path: '/get-info', handler: user_1.getUserInfo },
        { path: '/subscribed-community', handler: user_1.getSubscribedCommunities }
    ]);
    function routeGroup(group, ps, ...middlewares) {
        ps.forEach((p) => {
            router.post(`${group}${p.path}`, ...middlewares, ...(p.middlewares ? p.middlewares : []), p.handler);
        });
    }
}
exports.default = setRouter;
//# sourceMappingURL=index.js.map