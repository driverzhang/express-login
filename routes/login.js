/**
 * 引入 token 验证用户登录信息
 * @type {*|createApplication}
 */

const express = require('express');
const router = express.Router();
// 实现与MySQL交互
const mysql = require('mysql');
const config = require('../model/config');
const jwtP = require('../model/jwt');
const jwt = require('jsonwebtoken');
// 使用连接池，提升性能
var pool = mysql.createPool(config.mysql);

console.info('enter login.js');


/**
 * 监听 err.code === 'PROTOCOL_CONNECTION_LOST'
 * 设置数据库重新连接
 */
var connection;

function handleDisconnect() {
    connection = mysql.createConnection(config.mysql);
    connection.connect(function (err) {
        if (err) {
            console.log("进行断线重连：" + new Date());
            setTimeout(handleDisconnect, 2000);   //2秒重连一次
            return;
        }
        console.log("连接成功");
    });
    connection.on('error', function (err) {
        console.log('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect();
        } else {
            throw err;
        }
    });
}

handleDisconnect();

/**
 * @function lookToken
 * @description 检查 jwt token 密码
 * @param token
 * @param callback
 */
function lookToken(token, callback) {
    jwt.verify(token, 'Nodezhang', function (error, payload) { // 检验签名格式 用到 检验码
        if (error) {
            console.log(error);
            return callback;
        }
        callback(null, payload);

    });
}

/**
 * select 登录逻辑业务代码
 */

/* GET home page. */
/* 这里的路径定义都是相对于 app.js 中的 /local/ */
router.get('/', function (req, res, next) { // => /local
    res.render('login', {title: 'login'});
});

router.post('/userLogin', function (req, res, next) { // => /local/userLogin
    var username = req.body.username;//获取前台请求的参数
    var password = req.body.password;
    var token = req.body.token;
    // console.log('This is :'+token);
    if (token === undefined || !token) {
        return res.status(401).end('invalid token');
    }

    // 检查 jwt token 密码
    lookToken(token, function (error, payload) {
        if (error) {
            return res.status(402)
                .end('invalid token');
        }

        if (payload.exp < Date.now() / 1000) {
            return res.status(405)
                .end('expired token');
        }
        return payload;

    });




    pool.getConnection(function (err, connection) {

        //先判断该账号是否存在
        var $sql = "select * from users where username=?";

        connection.query($sql, [username], function (err, result) {
            var resultJson = result;
            console.log(resultJson.length);
            if (resultJson.length === 0) {
                result = {
                    code: 300,
                    msg: '该账号不存在'
                };
                res.json(result);
                connection.release(); //释放连接
            } else {  //账号存在，可以登录，进行密码判断
                var $sql1 = "select * from users where username=?";
                connection.query($sql1, [username], function (err, result) {
                    var temp = result[0].password;  //取得数据库查询字段值
                    console.log('temp:'+typeof temp);
                    console.log('passw:'+typeof password);
                    console.log(temp === password);
                    // => 这里应该注意数据库密码类型设置为varchar 为string 类型。
                    // 如果是 int 为 number 类型 那么这里与 password 的 string 就 不===了！！！
                    if (temp === password) { //验证账号密码通过 可以返回token啦!
                        var loginData = {
                            username: result[0].username,
                            password: result[0].password
                        };
                        var tokenData = jwtP.jwtProducer(loginData, 'nodezhang', result[0].id);
                        result = {
                            code: 200,
                            msg: '密码正确',
                            tokenData: tokenData,
                        };
                    } else {
                        result = {
                            code: 400,
                            msg: '密码错误'
                        };
                    }
                    res.json(result); // 以json形式，把操作结果返回给前台页面

                    connection.release();// 释放连接
                });
            }
        });
    });
});
module.exports = router;
