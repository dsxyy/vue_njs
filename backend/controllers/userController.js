const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { comparePassword } = require('../utils/password');
const { createCaptcha, verifyCaptcha } = require('../utils/captcha');
const { getCountryCode } = require('../utils/countryCodeMap');

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
            const { name, phone, countryCode, countryIso2, association_device, shareAccount, parentId, privileges, remark } = req.body;
            // 如果传入了countryIso2，则使用字典转换，否则使用传入的countryCode
            const finalCountryCode = countryIso2 ? getCountryCode(countryIso2) : (countryCode || '86');
            const [result] = await pool.query(
                'INSERT INTO user_info (name, phone, countryCode, association_device, shareAccount, parentId, privileges, remark, showable) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)',
                [name, phone, finalCountryCode, association_device, shareAccount, parentId, privileges, remark]
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
            const { name, phone, countryCode, countryIso2, association_device, shareAccount, parentId, privileges, remark } = req.body;
            // 如果传入了countryIso2，则使用字典转换，否则使用传入的countryCode
            const finalCountryCode = countryIso2 ? getCountryCode(countryIso2) : (countryCode || '86');
            await pool.query(
                'UPDATE user_info SET name = ?, phone = ?, countryCode = ?, association_device = ?, shareAccount = ?, parentId = ?, privileges = ?, remark = ? WHERE id = ?',
                [name, phone, finalCountryCode, association_device, shareAccount, parentId, privileges, remark, id]
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
            
            // 同时删除该用户在 scene_user_info 表中的所有关联
            await pool.query(
                'UPDATE scene_user_info SET del_flag = 1 WHERE userid = ?',
                [id]
            );
            
            // 同时删除该用户在 user_family_info 表中的所有关联
            await pool.query(
                'UPDATE user_family_info SET del_flag = 1 WHERE user_id = ?',
                [id]
            );
            
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
    },

    // 获取用户所属的家庭
    getUserFamilies: async (req, res) => {
        try {
            const { id } = req.params;
            
            // 查询用户所属的家庭（包括作为创建者和共享者）
            const [rows] = await pool.query(
                `SELECT f.id, f.name, uf.privileges as userRole
                 FROM family_info f
                 JOIN user_family_info uf ON f.id = uf.family_id
                 WHERE uf.user_id = ? AND f.del_flag = 0 AND uf.del_flag = 0
                 ORDER BY f.id DESC`,
                [id]
            );
            
            // 为每个家庭添加详细信息
            for (const family of rows) {
                // 获取家庭创建者
                const [ownerRows] = await pool.query(
                    `SELECT u.id, u.name FROM user_family_info uf 
                     JOIN user_info u ON uf.user_id = u.id 
                     WHERE uf.family_id = ? AND uf.privileges = 0 AND uf.del_flag = 0`,
                    [family.id]
                );
                family.owner = ownerRows[0] || null;
                
                // 获取家庭共享者
                const [sharedRows] = await pool.query(
                    `SELECT u.id, u.name FROM user_family_info uf 
                     JOIN user_info u ON uf.user_id = u.id 
                     WHERE uf.family_id = ? AND uf.privileges = 1 AND uf.del_flag = 0`,
                    [family.id]
                );
                family.sharedUsers = sharedRows;
                
                // 获取家庭房间
                const [scenes] = await pool.query(
                    'SELECT id, name FROM scene_info WHERE family_id = ?',
                    [family.id]
                );
                family.scenes = scenes;
                
                // 设置用户角色文本
                family.userRoleText = family.userRole === 0 ? '创建者' : '成员';
            }
            
            res.json({
                code: 200,
                message: '获取用户家庭列表成功',
                data: rows
            });
        } catch (error) {
            console.error('获取用户家庭列表失败:', error);
            res.status(500).json({ 
                code: 500,
                message: '获取用户家庭列表失败', 
                error: error.message 
            });
        }
    }
};

module.exports = userController;