const svgCaptcha = require('svg-captcha');

// 创建验证码
const createCaptcha = () => {
    const captcha = svgCaptcha.create({
        size: 4, // 验证码长度
        noise: 2, // 干扰线条数
        color: true, // 验证码的字符是否有颜色，默认没有，如果设定了背景，则默认有
        background: '#f0f2f5', // 验证码图片背景颜色
        width: 120,
        height: 40,
        fontSize: 40
    });
    return captcha;
};

// 验证验证码
const verifyCaptcha = (sessionCaptcha, userCaptcha) => {
    if (!sessionCaptcha || !userCaptcha) {
        return false;
    }
    return sessionCaptcha.toLowerCase() === userCaptcha.toLowerCase();
};

module.exports = {
    createCaptcha,
    verifyCaptcha
}; 