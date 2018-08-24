import { RequestHandler } from 'express';
import * as fs from 'fs';
import * as md5 from 'js-md5';
import logger from '../logger';
import db from '../db';
import { MediaUploadResp, code } from '../common/api/index';
const redis = db.redisdb;

export interface Files {
	[name: string]: {
		/**
     * req.files.foo.name: "car.jpg"
     * req.files.foo.mv: A function to move the file elsewhere on your server
     * req.files.foo.mimetype: The mimetype of your file
     * req.files.foo.data: A buffer representation of your file
     * req.files.foo.truncated: A boolean that represents if the file is over the size limit
     */
		name: string;
		mv: (path: string) => Promise<void>;
		mimetype: string;
		data: Buffer;
		truncated: boolean;
	};
}

interface MediaTemp {
	name: string;
	uri: string;
	mimetype: string;
	at: number;
}

export const uploadMedia: RequestHandler = async (req, resp) => {
	const files: Files = (req as any).files;
	const medias: MediaTemp[] = [];
	for (let name in files) {
		const file = files[name];
		let filename = '';
		if (/^image\/.*/.test(file.mimetype)) {
			filename = `webapp/assets/media/image/${md5(file.name + new Date().toString())}${file.name.substring(
				file.name.lastIndexOf('.')
			)}`;
		} else if (/^audio\/.*/.test(file.mimetype)) {
			filename = `webapp/assets/media/audio/${md5(file.name + new Date().toString())}${file.name.substring(
				file.name.lastIndexOf('.')
			)}`;
		} else if (/^video\/.*/.test(file.mimetype)) {
			filename = `webapp/assets/media/video/${md5(file.name + new Date().toString())}${file.name.substring(
				file.name.lastIndexOf('.')
			)}`;
		} else {
			continue;
		}
		try {
			await file.mv(filename);
			medias.push({
				name,
				uri: filename.substring(filename.indexOf('/')),
				mimetype: file.mimetype,
				at: new Date().getTime()
			});
		} catch (e) {
			logger.error(e);
		}
	}
	const respJson: MediaUploadResp = {
		code: code.success,
		medias
	};
	resp.json(respJson);
	setTimeout(async () => {
		const posts = db.posts;
		const cursor = posts.find({
			content: { $in: medias.map((m) => m.uri) }
		});
		if ((await cursor.count()) === 0) {
			medias.forEach((m) => {
				fs.unlink(`assets${m.uri}`, (err) => err && logger.error(err));
			});
		}
	}, 1000 * 60 * 5);
};
