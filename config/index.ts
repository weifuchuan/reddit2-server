import { MongoConnection, RedisOptions, ServerConfig, EmailConfig } from '../src/types/config';

export const mongoConnection: MongoConnection = {
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

export const redisConnectionOption: RedisOptions = {
	host: '127.0.0.1',
	port: 6379
};

export const serverConfig: ServerConfig = {
	port: 9100
};

export const emailConfig: EmailConfig = {
	host: 'smtp.aliyun.com',
	port: 25,
	secure: false,
	auth: {
		user: 'fuchuan.wei@aliyun.com',
		pass: 'url977782'
	},
	pool: true
};
