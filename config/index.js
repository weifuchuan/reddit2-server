"use strict";
exports.__esModule = true;
exports.mongoConnection = {
    url: {
        host: '127.0.0.1',
        port: 40001
    },
    otherUrls: [
        {
            host: '127.0.0.1',
            port: 40002
        }
    ],
    options: [
        {
            name: 'replicaSet',
            value: 'reddit'
        }
    ]
};
exports.redisConnectionOption = {
    host: '127.0.0.1',
    port: 6379
};
exports.serverConfig = {
    port: 9100
};
exports.emailConfig = {
    host: 'smtp.aliyun.com',
    port: 25,
    secure: false,
    auth: {
        user: 'fuchuan.wei@aliyun.com',
        pass: 'url977782'
    },
    pool: true
};
