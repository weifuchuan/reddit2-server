import { Post } from '../db/model';
import db from '../db';
import { ObjectID } from 'bson';

export async function createPost(post: Post): Promise<Post> {
	await db.runInTransaction(async (session) => {
		const posts = db.posts;
		const cntResult = await posts
			.aggregate<{ cnt: number }>(
				[ { $project: { slug: 1 } }, { $match: { slug: { $regex: `^${post.slug}\d*$` } } }, { $count: 'cnt' } ],
				{ session }
			)
			.toArray();
		const cnt = cntResult.length === 0 ? 0 : cntResult[0].cnt;
		if (cnt !== 0) {
			post.slug += cnt;
		}
		post._id = (await posts.insertOne(post, { session })).insertedId;
	});
	return post;
}

export async function getPostsByIds(ids: ObjectID[]): Promise<Post[]> {
	const posts = db.posts;
	return posts.find({ _id: { $in: ids } }).toArray();
}
