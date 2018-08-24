import { EmailConfig } from '../types/config';
import nodemailer = require('nodemailer');

const emailConfig: EmailConfig = require('../../config/index.js').emailConfig;

let transporter = nodemailer.createTransport(emailConfig);

export async function sendCode(to: string, code: string): Promise<nodemailer.SentMessageInfo> {
	return await transporter.sendMail({
		from: 'fuchuan.wei@aliyun.com',
		to,
		subject: `Reddit2: 您的验证码为${code}`,
		html: `
      <h1>您的验证码为${code}</h1>
      <p>请勿回复</p>
    `
	});
}
