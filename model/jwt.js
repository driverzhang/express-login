/**
 * @function    jwtProducer
 * @description jwt的统一生产方法
 * @returns     {{username: *, token: *}}
 */
const jwt = require('jsonwebtoken');

module.exports =  {

    /*这里的 username 是 用户的账号+密码*/
    jwtProducer: function (username, dbName, userId) {
        // JWT Id
        const jti = (Math.random() * 100000000000000000).toString();
        // JWT 的签发者
        const iss = 'localhost';
        // 签发时间
        const iat = Date.now() / 1000;
        // 失效时间
        const exp = iat + 7200;
        // 用户 ID
        const sub = userId;
        // 数据库名称
        const location = dbName;

        const payload = {
            jti: jti,
            iss: iss,
            iat: iat,
            exp: exp,
            sub: sub,
            location: location
        };

        var token = jwt.sign(payload, 'Nodezhang'); // 'Nodezhang'是自定义的校验码。

        return {
            operatorUsername: username,
            token: token
        };

    }


};