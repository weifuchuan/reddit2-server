import { User } from '../db/model';
import db from '../db';
import { FindOneOptions } from 'mongodb';
import defaultHeadImg from './defaultHeadImg';
import { ObjectID } from 'bson';

export async function findUserByEmail(email: string): Promise<User> {
	const users = db.users;
	let user: User | null;
	user = await users.findOne({ email });
	if (user) {
		return user;
	} else {
		throw '用户不存在';
	}
}

export async function findUserByUsername(username: string): Promise<User> {
	const users = db.users;
	let user: User | null;
	user = await users.findOne({ username });
	if (user) {
		return user;
	} else {
		throw '用户不存在';
	}
}

export async function findUserById(id: string): Promise<User> {
	const users = db.users;
	let user: User | null;
	user = await users.findOne({ _id: new ObjectID(id) });
	if (user) {
		return user;
	} else {
		throw '用户不存在';
	}
}

export async function usernameExists(username: string): Promise<boolean> {
	const users = db.users;
	return null !== (await users.findOne({ username }, { projection: { _id: 1 }, limit: 1 } as FindOneOptions));
}

export async function emailExists(email: string): Promise<boolean> {
	const users = db.users;
	const user = await users.findOne({ email }, { projection: { _id: 1 }, limit: 1 } as FindOneOptions)
	return null !== user;
}

export async function addUser(username: string, email: string, password: string): Promise<User> {
	const users = db.users;
	const result = await users.insertOne({
		username,
		email,
		password,
		headImg: defaultHeadImg,
		subscribedCommunities: []
	});
	return {
		_id: result.insertedId,
		username,
		email,
		password: '',
		headImg: defaultHeadImg,
		subscribedCommunities: []
	};
}
