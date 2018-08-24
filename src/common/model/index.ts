export interface User {
	_id: string;
	username: string;
	email: string;
	headImg: string;
	password: string;
	subscribedCommunities: string[];
}

export interface Community {
	_id: string;
	name: string;
	detail: string;
	rules: {
		name: string;
		content: string;
	}[];
}

export interface Interloper {
	_id: string;
	communityId: string;
	userId: string;
	interlopedTime: number;
}

export interface Follow {
	_id: string;
	myId: string;
	otherId: string;
	followTime: number;
}

export interface Post {
	_id: string;
	slug: string;
	authorId: string;
	title: string;
	content: string;
	kid: 'post' | 'imageOrVedio' | 'link';
	tags: string[];
	createAt: number;
	modifyAt: number;
	communityId?: string;
	likeCount: number;
	nayCount: number;
	comments: Comment[];
}

export interface Comment {
	authorId: string;
	content: string;
	createAt: number;
	likeCount: number;
	nayCount: number;
	comments: Comment[];
}

