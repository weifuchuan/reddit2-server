import jwt = require('jsonwebtoken');
import md5 = require('js-md5');

const secret = `fuchuan${md5(new Date().toString() + Math.random())}`;

export default {
	sign<T = any>(data: T, options: jwt.SignOptions = { expiresIn: 3000 }): string {
		return jwt.sign(
			{
				data
			},
			secret,
			options
		);
	},
	verify<T = any>(token: string): any {
		return (jwt.verify(token, secret) as any).data;
	}
};
