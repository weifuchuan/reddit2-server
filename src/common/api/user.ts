import { Resp } from './base';
import { User } from '../model';

/*
  POST /login 
  req:
    LoginReq
  resp:
    success: 
      LoginResp
        code = code.success  
    error:
      Resp
        code = code.error
        msg = <error info>
*/
export interface LoginReq {
	loginer: string;
	password: string;
}
export interface LoginResp extends Resp {
	user: any;
	token: string;
	refreshToken: string;
}

/*
  POST /reg
  req: 
    RegReq
  resp:
    success: 
      RegResp
        code = code.success  
    error:
      Resp
        code = code.error
        msg = <error info>
*/
export interface RegReq {
	username: string;
	email: string;
	password: string;
	code: string;
}
export interface RegResp extends LoginResp {}

/*
  POST /auth
  req:
    Headers: 
      Authorization: Bearer <token>
  resp:
    success: 
      AuthResp
        code = code.success  
    error:
      Resp
        code = code.error
        msg = <error info>
*/
export interface AuthResp extends Resp {
	user: any;
}

/*
  POST /confirm-email
  req:
    ConfirmEmailReq
  resp:
    success: 
      Resp
        code = code.success  
    error:
      Resp
        code = code.error
        msg = <error info>
*/
export interface ConfirmEmailReq {
	email: string;
}

/*
  POST /refresh-token
  req:
    RefreshTokenReq
  resp:
    success:
      RefreshTokenResp
    error:
      code: 401
*/
export interface RefreshTokenReq {
	id: string;
	refreshToken: string;
}
export interface RefreshTokenResp {
	token: string;
}

/*
  POST /refresh-token/eject
  req:
    RefreshTokenEjectReq
*/
export interface RefreshTokenEjectReq {
	refreshToken: string;
}

/*
  POST /user/get-info
  req:
    GetUserInfoReq
  resp:
    GetUserInfoResp
*/
export interface GetUserInfoReq {
	id: string;
}

export interface GetUserInfoResp extends Resp {
	user: User;
}

/*
	POST /user/subscribed-community
	req:
		GetSubscribedCommunitiesReq
	resp:
		GetSubscribedCommunitiesResp
	
*/
export interface GetSubscribedCommunitiesReq{
	userId: string; 
}

export interface GetSubscribedCommunitiesResp extends Resp{
	communityIds: string[]; 
}

