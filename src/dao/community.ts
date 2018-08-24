import { ObjectID } from 'bson';
import db from '../db';
import { Community } from '../db/model';

export async function getCommunities(ids: ObjectID[]): Promise<Community[]> {
	const col = db.communities;
	return await col.find({ _id: { $in: ids } }).toArray();
}
