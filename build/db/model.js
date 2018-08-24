"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSchema = {
    bsonType: 'object',
    required: ['username', 'email', 'password', 'headImg', 'subscribedCommunities'],
    properties: {
        username: {
            bsonType: 'string',
            pattern: '^[a-zA-Z0-9_\u4e00-\u9fa5]{2,20}$',
            description: 'must be a username string and is required, it just contains 汉字, alphabet, number, _, 2 <= length <= 20 '
        },
        email: {
            bsonType: 'string',
            pattern: '^[a-z0-9]+([._\\-]*[a-z0-9])*@([a-z0-9]+[-a-z0-9]*[a-z0-9]+.){1,63}[a-z0-9]+$',
            description: 'must be a email string and is not required'
        },
        password: {
            bsonType: 'string',
            minLength: 32,
            maxLength: 32,
            description: 'must be a password string and is not required'
        },
        headImg: { bsonType: 'string' },
        subscribedCommunities: {
            bsonType: 'array',
            items: {
                bsonType: 'objectId',
                description: 'must be a ObjectID'
            },
            description: 'must be a ObjectID array'
        }
    }
};
exports.CommunitySchema = {
    bsonType: 'object',
    required: ['name', 'detail', 'rules'],
    properties: {
        name: {
            bsonType: 'string',
            pattern: '^[a-zA-Z0-9-_\u4e00-\u9fa5]{2,50}$',
            description: 'must be a string and is required'
        },
        detail: {
            bsonType: 'string',
            maxLength: 1000,
            description: 'must be a string and is not required'
        },
        rules: {
            bsonType: 'array',
            items: {
                bsonType: 'object',
                required: ['name', 'content'],
                properties: {
                    name: {
                        bsonType: 'string',
                        maxLength: 100
                    },
                    content: {
                        bsonType: 'string',
                        maxLength: 1000
                    }
                },
                description: 'must be a Object'
            },
            description: 'must be a Object array'
        }
    }
};
exports.InterloperSchema = {
    bsonType: 'object',
    required: ['communityId', 'userId', 'interlopedTime'],
    properties: {
        communityId: {
            bsonType: 'objectId'
        },
        userId: {
            bsonType: 'objectId'
        },
        interlopedTime: {
            bsonType: 'number'
        }
    }
};
exports.FollowSchema = {
    bsonType: 'object',
    required: ['myId', 'otherId', 'followTime'],
    properties: {
        myId: {
            bsonType: 'objectId'
        },
        otherId: {
            bsonType: 'objectId'
        },
        followTime: {
            bsonType: 'number'
        }
    }
};
exports.PostSchema = {
    bsonType: 'object',
    required: [
        'authorId',
        'slug',
        'title',
        'content',
        'kid',
        'createAt',
        'modifyAt',
        // 'communityId',
        'tags',
        'likeCount',
        'nayCount',
        'comments'
    ],
    properties: {
        authorId: {
            bsonType: 'objectId'
        },
        slug: {
            bsonType: 'string'
        },
        title: {
            bsonType: 'string',
            maxLength: 1000
        },
        content: {
            bsonType: 'string'
        },
        kid: {
            bsonType: 'string',
            pattern: '^(post)|(imageOrVedio)|(link)$'
        },
        tags: {
            bsonType: 'array',
            items: {
                bsonType: 'string'
            }
        },
        createAt: {
            bsonType: 'number'
        },
        modifyAt: {
            bsonType: 'number'
        },
        communityId: {
            bsonType: 'objectId'
        },
        likeCount: {
            bsonType: 'number',
            minimum: 0
        },
        nayCount: {
            bsonType: 'number',
            minimum: 0
        },
        comments: {
            bsonType: 'array',
            items: {
                bsonType: 'object',
                required: ['authorId', 'content', 'createAt', 'likeCount', 'nayCount', 'comments'],
                properties: {
                    authorId: {
                        bsonType: 'objectId'
                    },
                    content: {
                        bsonType: 'string'
                    },
                    createAt: {
                        bsonType: 'number'
                    },
                    nayCount: {
                        bsonType: 'number',
                        minimum: 0
                    },
                    comments: {
                        bsonType: 'array',
                        items: {
                            bsonType: 'object'
                        }
                    }
                }
            }
        }
    }
};
//# sourceMappingURL=model.js.map