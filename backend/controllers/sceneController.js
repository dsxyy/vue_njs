const pool = require('../config/database');

const sceneController = {
    // 获取场景列表
    getScenes: async (req, res) => {
        try {
            // 构建搜索条件
            const { name, emergency_contact, page = 1, limit = 10 } = req.query;
            let whereClause = '';
            const params = [];
            
            if (name || emergency_contact) {
                whereClause = 'WHERE ';
                const conditions = [];
                
                if (name) {
                    conditions.push('name LIKE ?');
                    params.push(`%${name}%`);
                }
                if (emergency_contact) {
                    conditions.push('emergencyContact LIKE ?');
                    params.push(`%${emergency_contact}%`);
                }
                
                whereClause += conditions.join(' AND ');
            }

            // 计算分页
            const offset = (page - 1) * limit;

            // 获取总数
            const [countResult] = await pool.query(
                `SELECT COUNT(*) as total FROM scene_info ${whereClause}`,
                params
            );
            const total = countResult[0].total;

            // 获取分页数据
            const [rows] = await pool.query(
                `SELECT * FROM scene_info ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
                [...params, parseInt(limit), offset]
            );
            
            res.json({
                code: 200,
                message: '获取场景列表成功',
                data: rows,
                total: total
            });
        } catch (error) {
            console.error('获取场景列表失败:', error);
            res.status(500).json({ 
                code: 500,
                message: '获取场景列表失败', 
                error: error.message 
            });
        }
    },

    // 创建新场景
    createScene: async (req, res) => {
        try {
            const { name, room_x_length, room_y_length, emergencyContact } = req.body;
            const [result] = await pool.query(
                'INSERT INTO scene_info (name, room_x_length, room_y_length, emergencyContact) VALUES (?, ?, ?, ?)',
                [name, room_x_length, room_y_length, emergencyContact]
            );
            res.status(201).json({ id: result.insertId, message: '场景创建成功' });
        } catch (error) {
            res.status(500).json({ message: '创建场景失败', error: error.message });
        }
    },

    // 更新场景信息
    updateScene: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, room_x_length, room_y_length, emergencyContact } = req.body;
            await pool.query(
                'UPDATE scene_info SET name = ?, room_x_length = ?, room_y_length = ?, emergencyContact = ? WHERE id = ?',
                [name, room_x_length, room_y_length, emergencyContact, id]
            );
            res.json({ message: '场景更新成功' });
        } catch (error) {
            res.status(500).json({ message: '更新场景失败', error: error.message });
        }
    },

    // 删除场景
    deleteScene: async (req, res) => {
        try {
            const { id } = req.params;
            await pool.query('DELETE FROM scene_info WHERE id = ?', [id]);
            res.json({ message: '场景删除成功' });
        } catch (error) {
            res.status(500).json({ message: '删除场景失败', error: error.message });
        }
    },

    // 获取单个场景详情
    getSceneById: async (req, res) => {
        try {
            const { id } = req.params;
            const [rows] = await pool.query('SELECT * FROM scene_info WHERE id = ?', [id]);
            if (rows.length === 0) {
                return res.status(404).json({ message: '场景不存在' });
            }
            res.json(rows[0]);
        } catch (error) {
            res.status(500).json({ message: '获取场景详情失败', error: error.message });
        }
    },

    // 获取场景的用户列表
    getSceneUsers: async (req, res) => {
        try {
            const sceneId = req.params.id;
            const [users] = await pool.query(`
                SELECT u.* FROM user_info u
                INNER JOIN scene_user_info sui ON u.id = sui.userid
                WHERE sui.scene_id = ? GROUP BY sui.userid,sui.scene_id
            `, [sceneId]);
            
            res.json({
                code: 200,
                message: '获取场景用户列表成功',
                data: users
            });
        } catch (error) {
            console.error('获取场景用户列表失败:', error);
            res.status(500).json({
                code: 500,
                message: '获取场景用户列表失败',
                error: error.message
            });
        }
    },

    // 更新场景的用户列表
    updateSceneUsers: async (req, res) => {
        const connection = await pool.getConnection();
        try {
            const sceneId = req.params.id;
            const { userIds } = req.body;

            // 开始事务
            await connection.beginTransaction();

            try {
                // 删除原有的用户关联
                await connection.query('DELETE FROM scene_user_info WHERE scene_id = ?', [sceneId]);

                // 插入新的用户关联
                if (userIds && userIds.length > 0) {
                    const values = userIds.map(userId => [sceneId, userId]);
                    await connection.query('INSERT INTO scene_user_info (scene_id, userid) VALUES ?', [values]);
                }

                // 提交事务
                await connection.commit();

                res.json({
                    code: 200,
                    message: '更新场景用户列表成功'
                });
            } catch (error) {
                // 回滚事务
                await connection.rollback();
                throw error;
            }
        } catch (error) {
            console.error('更新场景用户列表失败:', error);
            res.status(500).json({
                code: 500,
                message: '更新场景用户列表失败',
                error: error.message
            });
        } finally {
            // 释放连接
            connection.release();
        }
    },

    // 批量获取场景的用户列表
    getScenesUsersBatch: async (req, res) => {
        try {
            const { sceneIds } = req.body;
            if (!Array.isArray(sceneIds) || sceneIds.length === 0) {
                return res.json({
                    code: 200,
                    message: '获取场景用户列表成功',
                    data: {}
                });
            }

            const [rows] = await pool.query(`
                SELECT sui.scene_id, u.* 
                FROM scene_user_info sui
                INNER JOIN user_info u ON u.id = sui.userid
                WHERE sui.scene_id IN (?)
                GROUP BY sui.userid, sui.scene_id
            `, [sceneIds]);

            // 将结果转换为以场景ID为键的映射
            const usersMap = {};
            rows.forEach(row => {
                const sceneId = row.scene_id;
                if (!usersMap[sceneId]) {
                    usersMap[sceneId] = [];
                }
                usersMap[sceneId].push({
                    id: row.id,
                    name: row.name,
                    phone: row.phone,
                    privileges: row.privileges
                });
            });
            
            res.json({
                code: 200,
                message: '获取场景用户列表成功',
                data: usersMap
            });
        } catch (error) {
            console.error('批量获取场景用户列表失败:', error);
            res.status(500).json({
                code: 500,
                message: '批量获取场景用户列表失败',
                error: error.message
            });
        }
    },

    // 获取所有场景列表（不分页，用于分配功能）
    getAllScenes: async (req, res) => {
        try {
            const [rows] = await pool.query(
                'SELECT id, name FROM scene_info ORDER BY id DESC'
            );
            
            res.json({
                code: 200,
                message: '获取场景列表成功',
                data: rows
            });
        } catch (error) {
            console.error('获取场景列表失败:', error);
            res.status(500).json({ 
                code: 500,
                message: '获取场景列表失败', 
                error: error.message 
            });
        }
    },

    // 获取场景内的设备列表
    getSceneDevices: async (req, res) => {
        try {
            const { id } = req.params;
            const [devices] = await pool.query(
                `SELECT * FROM device_info 
                WHERE sceneId = ? AND showAble = 1 
                ORDER BY id DESC`,
                [id]
            );
            
            res.json({
                code: 200,
                message: '获取场景设备列表成功',
                data: devices
            });
        } catch (error) {
            console.error('获取场景设备列表失败:', error);
            res.status(500).json({ 
                code: 500,
                message: '获取场景设备列表失败', 
                error: error.message 
            });
        }
    }
};

module.exports = sceneController; 