import { Resp } from "./base";


/*
  POST /community/get-infos
  req:
    GetCommunitiesInfoReq
  resp:
    GetCommunitiesInfoResp
*/

export interface GetCommunitiesInfoReq {
	ids: string[];
}

export interface GetCommunitiesInfoResp extends Resp {
	communities: {
		_id: string;
		name: string;
		detail: string;
		rules: {
			name: string;
			content: string;
		}[];
	}[];
}

/*
	POST /community/subscriber/count
	req:
		GetCommunitySubscriberCountReq
	resp: 
		GetCommunitySubscriberCountResp
*/
export interface GetCommunitySubscriberCountReq{
	ids: string[]; 
}

export interface GetCommunitySubscriberCountResp extends Resp {
	data: {
		[id: string]: number; 
	};
}

/*
	POST /community/subscribe 
	req:
		SubscribeCommunityReq
	resp:
		Resp 
*/
export interface SubscribeCommunityReq{
	id: string; 
} 

/*
	POST /community/unsubscribe 
	req:
		UnsubscribeCommunityReq
	resp:
		Resp 
*/
export interface UnsubscribeCommunityReq{
	id: string; 
} 

/*
	POST /community/trending
	req:
	resp:
		GetTrendingCommunities
*/

export interface GetTrendingCommunitiesResp extends Resp  {
	ids: string[]; 
}













