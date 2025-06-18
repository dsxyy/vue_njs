const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { comparePassword } = require('../utils/password');
const { createCaptcha, verifyCaptcha } = require('../utils/captcha');

const userController = {
    // 生成验证码
    getCaptcha: (req, res) => {
        const captcha = createCaptcha();
        // 将验证码文本存储在session中
        req.session.captcha = captcha.text;
        
        console.log('生成验证码:', captcha.text);
        console.log('Session ID:', req.sessionID);
        console.log('Session captcha:', req.session.captcha);
        
        res.type('svg');
        res.status(200).send(captcha.data);
    },

    // 登录验证
    login: async (req, res) => {
        try {
            const { username, password, captcha } = req.body;
            
            // 跳过验证码校验
            // if (!verifyCaptcha(req.session.captcha, captcha)) {
            //     return res.json({
            //         code: 401,
            //         message: '验证码错误'
            //     });
            // }
            // req.session.captcha = null;

            // 从sys_user_info表中查询用户
            const [rows] = await pool.query(
                'SELECT * FROM sys_user_info WHERE name = ?',
                [username]
            );
            
            if (rows.length === 0) {
                return res.json({
                    code: 401,
                    message: '用户名或密码错误'
                });
            }
            
            const user = rows[0];
            
            // 验证密码
            const isMatch = await comparePassword(password, user.password);
            if (!isMatch) {
                return res.json({
                    code: 401,
                    message: '用户名或密码错误'
                });
            }
            
            // 生成JWT token
            const token = jwt.sign(
                { id: user.id, username: user.name },
                'your-secret-key', // 请在生产环境中使用环境变量存储密钥
                { expiresIn: '30m' } // 设置为30分钟过期
            );
            
            res.json({
                code: 200,
                message: '登录成功',
                token
            });
        } catch (error) {
            console.error('登录失败:', error);
            res.json({
                code: 500,
                message: '登录失败'
            });
        }
    },

    // 获取用户列表
    getUsers: async (req, res) => {
        try {
            // 构建搜索条件
            const { name, phone, privileges, page = 1, limit = 10 } = req.query;
            let whereClause = 'WHERE showable = 1';  // 添加showable条件
            const params = [];
            
            if (name || phone || privileges) {
                const conditions = [];
                
                if (name) {
                    conditions.push('name LIKE ?');
                    params.push(`%${name}%`);
                }
                if (phone) {
                    conditions.push('phone LIKE ?');
                    params.push(`%${phone}%`);
                }
                if (privileges) {
                    conditions.push('privileges = ?');
                    params.push(privileges);
                }
                
                whereClause += ' AND ' + conditions.join(' AND ');
            }

            // 计算分页
            const offset = (page - 1) * limit;

            // 获取总数
            const [countResult] = await pool.query(
                `SELECT COUNT(*) as total FROM user_info ${whereClause}`,
                params
            );
            const total = countResult[0].total;

            // 获取分页数据
            const [rows] = await pool.query(
                `SELECT * FROM user_info ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
                [...params, parseInt(limit), offset]
            );
            
            res.json({
                code: 200,
                message: '获取用户列表成功',
                data: rows,
                total: total
            });
        } catch (error) {
            console.error('获取用户列表失败:', error);
            res.json({ 
                code: 500,
                message: '获取用户列表失败', 
                error: error.message 
            });
        }
    },

    // 创建新用户
    createUser: async (req, res) => {
        try {
            const { name, phone, association_device, shareAccount, parentId, privileges } = req.body;
            const [result] = await pool.query(
                'INSERT INTO user_info (name, phone, association_device, shareAccount, parentId, privileges, showable) VALUES (?, ?, ?, ?, ?, ?, 1)',
                [name, phone, association_device, shareAccount, parentId, privileges]
            );
            res.status(201).json({ id: result.insertId, message: '用户创建成功' });
        } catch (error) {
            res.status(500).json({ message: '创建用户失败', error: error.message });
        }
    },

    // 更新用户信息
    updateUser: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, phone, association_device, shareAccount, parentId, privileges } = req.body;
            await pool.query(
                'UPDATE user_info SET name = ?, phone = ?, association_device = ?, shareAccount = ?, parentId = ?, privileges = ? WHERE id = ?',
                [name, phone, association_device, shareAccount, parentId, privileges, id]
            );
            res.json({ message: '用户更新成功' });
        } catch (error) {
            res.status(500).json({ message: '更新用户失败', error: error.message });
        }
    },

    // 删除用户（软删除）
    deleteUser: async (req, res) => {
        try {
            const { id } = req.params;
            const [result] = await pool.query(
                'UPDATE user_info SET showable = 2 WHERE id = ? AND showable = 1',
                [id]
            );
            
            if (result.affectedRows === 0) {
                return res.json({
                    code: 404,
                    message: '用户不存在或已被删除'
                });
            }
            
            res.json({
                code: 200,
                message: '用户删除成功'
            });
        } catch (error) {
            console.error('删除用户失败:', error);
            res.json({
                code: 500,
                message: '删除用户失败',
                error: error.message
            });
        }
    },

    // 获取单个用户详情
    getUserById: async (req, res) => {
        try {
            const { id } = req.params;
            const [rows] = await pool.query('SELECT * FROM user_info WHERE id = ?', [id]);
            if (rows.length === 0) {
                return res.status(404).json({ message: '用户不存在' });
            }
            res.json(rows[0]);
        } catch (error) {
            res.status(500).json({ message: '获取用户详情失败', error: error.message });
        }
    },

    // 获取已分配的用户列表
    getAssignedUsers: async (req, res) => {
        try {
            const { id } = req.params;
            const [rows] = await pool.query(`
                SELECT s.* FROM scene_info s
                INNER JOIN scene_user_info sui ON s.id = sui.scene_id
                WHERE sui.userid = ?
                ORDER BY s.id DESC
            `, [id]);
            res.json({
                code: 200,
                message: '获取已分配用户列表成功',
                data: rows
            });
        } catch (error) {
            console.error('获取已分配用户列表失败:', error);
            res.status(500).json({
                code: 500,
                message: '获取已分配用户列表失败',
                error: error.message
            });
        }
    },

    // 更新用户分配
    updateUserAssignment: async (req, res) => {
        const connection = await pool.getConnection();
        try {
            const { id } = req.params;
            const sceneId = req.body.sceneIds || [];

            // 开始事务
            await connection.beginTransaction();

            try {
                await connection.query('DELETE FROM scene_user_info WHERE userid =?', [id]);
                for (const scene of sceneId) {
                    await connection.query('INSERT INTO scene_user_info (scene_id, userid) VALUES (?, ?)', [scene, id]);
                }
                // 提交事务
                await connection.commit();

                res.json({
                    code: 200,
                    message: '更新用户分配成功'
                });
            } catch (error) {
                // 回滚事务
                await connection.rollback();
                throw error;
            }
        } catch (error) {
            console.error('更新用户分配失败:', error);
            res.status(500).json({
                code: 500,
                message: '更新用户分配失败',
                error: error.message
            });
        } finally {
            // 释放连接
            connection.release();
        }
    },

    // 获取所有用户列表（不分页，用于分配功能）
    getAllUsers: async (req, res) => {
        try {
            const [rows] = await pool.query(
                'SELECT id, name, phone, privileges FROM user_info WHERE showable = 1 ORDER BY id DESC'
            );
            
            res.json({
                code: 200,
                message: '获取用户列表成功',
                data: rows
            });
        } catch (error) {
            console.error('获取用户列表失败:', error);
            res.status(500).json({ 
                code: 500,
                message: '获取用户列表失败', 
                error: error.message 
            });
        }
    }
};

module.exports = userController;