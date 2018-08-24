export namespace code {
	export const success = 200;
	export const error = 500;
	export const noAuth = 400;
}

export interface Resp {
	code: number;
	msg?: string;
}