import { MongoClientOptions } from 'mongodb';
export { RedisOptions } from 'ioredis';

export interface MongoConnection {
	// mongodb://[username:password@]host1[:port1][,host2[:port2],...[,hostN[:portN]]][/[database][?options]]
	username?: string;
	password?: string;
	url: {
		host: string;
		port?: number;
	};
	otherUrls?: {
		host: string;
		port?: number;
	}[];
	options?: {
		name: string;
		value: string;
	}[];
	connectClientOption?: MongoClientOptions;
}

export interface ServerConfig {
	port: number;
}

export interface EmailConfig {
	host: string;
	port: number;
	secure: boolean;
	auth: {
		user: string;
		pass: string;
	};
	pool: boolean;
}
