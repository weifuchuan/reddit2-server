"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer = require("nodemailer");
const emailConfig = require('../../config/index.js').emailConfig;
let transporter = nodemailer.createTransport(emailConfig);
function sendCode(to, code) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield transporter.sendMail({
            from: 'fuchuan.wei@aliyun.com',
            to,
            subject: `Reddit2: 您的验证码为${code}`,
            html: `
      <h1>您的验证码为${code}</h1>
      <p>请勿回复</p>
    `
        });
    });
}
exports.sendCode = sendCode;
//# sourceMappingURL=email.js.map