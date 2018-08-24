import { Resp } from './base';
import { Post, Comment } from '../model';

/*
  POST /post/create
  req:
    CreatePostReq
  resp:
    success:
      CreatePostResp
    error:
      
*/
export interface CreatePostReq {
	title: string;
	content: string;
	kid: 'post' | 'imageOrVedio' | 'link';
	createAt: number;
	communityId?: string;
	tags: string[];
}

export interface CreatePostResp extends Resp {
	_id: string;
	slug: string;
}

/*
  POST /media/upload
  req:
    文件
  resp:
    success:
      MediaUploadResp
    error: 
      413
*/
export interface MediaUploadResp extends Resp {
	medias: {
		name: string;
		uri: string;
		mimetype: string;
	}[];
}

/*
  Post /post/get/ids
  req:
    GetAllPostByIdsReq
  resp:
    GetAllPostByIdsResp
*/
export interface GetPostByIdsReq {
	ids: string[];
	getterId?: string;
}

export interface GetPostByIdsResp extends Resp {
	posts: Post[];
	getterLikePosts?: string[];
	getterNayPosts?: string[];
}

/*
  POST /post/get/all/new
  req:
    GetAllPostByNewReq
  resp:
    GetAllPostByNewResp
*/
export interface GetAllPostByNewReq {
	lastCreateAt?: number;
	count?: number;
  justId?: boolean;
  getterId?: string;
}

export interface GetAllPostByNewResp extends Resp {
	posts: string[] | Post[];
	getterLikePosts?: string[];
	getterNayPosts?: string[];
}

/*
  POST /post/feel
  req:
    FeelPostReq
  resp:
    Resp
*/
export interface FeelPostReq {
	id: string;
	action: 'like' | 'nay' | 'soso';
}

/*
  POST /post/comment
  req:
	CommentPost
  resp:
    Resp 
*/
export interface CommentPostReq{
	postId: string; 
	comment: Comment; 
	indexes: number[]; 
}

/*
	POST /post/delete 
	req:
		DeletePostReq
	resp:
		Resp 
*/
export interface DeletePostReq{
	id:string; 
}


