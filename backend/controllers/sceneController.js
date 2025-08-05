const pool = require('../config/database');
const { uploadDeviceInfo } = require('../utils/deviceUploader');

const sceneController = {
    // 获取场景列表
    getScenes: async (req, res) => {
        try {
            // 构建搜索条件
            const { name, emergency_contact, page = 1, limit = 10 } = req.query;
            let whereClause = 'WHERE s.del_flag = 0';
            const params = [];
            
            if (name || emergency_contact) {
                const conditions = [];
                
                if (name) {
                    conditions.push('s.name LIKE ?');
                    params.push(`%${name}%`);
                }
                if (emergency_contact) {
                    conditions.push('s.emergencyContact LIKE ?');
                    params.push(`%${emergency_contact}%`);
                }
                
                whereClause += ' AND ' + conditions.join(' AND ');
            }

            // 计算分页
            const offset = (page - 1) * limit;

            // 获取总数
            const [countResult] = await pool.query(
                `SELECT COUNT(*) as total FROM scene_info s ${whereClause}`,
                params
            );
            const total = countResult[0].total;

            // 获取分页数据，关联家庭信息
            const [rows] = await pool.query(
                `SELECT s.*, f.name as family_name 
                FROM scene_info s 
                LEFT JOIN family_info f ON s.family_id = f.id AND f.del_flag = 0
                ${whereClause} 
                ORDER BY s.id DESC LIMIT ? OFFSET ?`,
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
            const { name, room_x_length, room_y_length, emergencyContact, family_id } = req.body;
            const [result] = await pool.query(
                'INSERT INTO scene_info (name, room_x_length, room_y_length, emergencyContact, family_id, del_flag) VALUES (?, ?, ?, ?, ?, 0)',
                [name, room_x_length, room_y_length, emergencyContact, family_id || null]
            );
            
            // 如果指定了家庭ID，需要同步更新 scene_user_info 表
            if (family_id) {
                // 获取该家庭的所有成员（包括创建者和共享者）
                const [familyUsers] = await pool.query(
                    `SELECT user_id FROM user_family_info WHERE family_id = ? AND del_flag = 0`,
                    [family_id]
                );
                
                // 为每个家庭成员创建房间关联
                for (const user of familyUsers) {
                    await pool.query(
                        'INSERT INTO scene_user_info (scene_id, userid, del_flag) VALUES (?, ?, 0)',
                        [result.insertId, user.user_id]
                    );
                }
            }
            
            res.status(201).json({ id: result.insertId, message: '场景创建成功' });
        } catch (error) {
            res.status(500).json({ message: '创建场景失败', error: error.message });
        }
    },

    // 更新场景信息
    updateScene: async (req, res) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            
            const { id } = req.params;
            const { name, room_x_length, room_y_length, emergencyContact, family_id } = req.body;
            
            // 获取更新前的家庭ID，用于比较是否需要更新 scene_user_info
            const [oldScene] = await connection.query(
                'SELECT family_id FROM scene_info WHERE id = ?',
                [id]
            );
            const oldFamilyId = oldScene[0]?.family_id;
            
            // 更新场景信息
            await connection.query(
                'UPDATE scene_info SET name = ?, room_x_length = ?, room_y_length = ?, emergencyContact = ?, family_id = ? WHERE id = ? AND del_flag = 0',
                [name, room_x_length, room_y_length, emergencyContact, family_id || null, id]
            );
            
            // 更新该场景下所有设备的deltaX_room和deltaY_room
            await connection.query(
                'UPDATE device_info SET deltaX_room = ?, deltaY_room = ? WHERE sceneId = ?',
                [room_x_length, room_y_length, id]
            );
            
            // 如果家庭ID发生了变化，需要更新 scene_user_info 表
            if (oldFamilyId !== family_id) {
                // 先删除该房间的所有用户关联
                await connection.query(
                    'UPDATE scene_user_info SET del_flag = 1 WHERE scene_id = ?',
                    [id]
                );
                
                // 如果新的家庭ID不为空，为该家庭的所有成员创建房间关联
                if (family_id) {
                    const [familyUsers] = await connection.query(
                        `SELECT user_id FROM user_family_info WHERE family_id = ? AND del_flag = 0`,
                        [family_id]
                    );
                    
                    for (const user of familyUsers) {
                        await connection.query(
                            'INSERT INTO scene_user_info (scene_id, userid, del_flag) VALUES (?, ?, 0)',
                            [id, user.user_id]
                        );
                    }
                }
            }
            
            await connection.commit();
            res.json({ message: '场景更新成功' });
        } catch (error) {
            await connection.rollback();
            res.status(500).json({ message: '更新场景失败', error: error.message });
        } finally {
            connection.release();
        }
        
        // 查询该场景下的所有设备
        const [devices] = await connection.query('SELECT * FROM device_info WHERE sceneId = ?', [id]);
        
        // 对每个设备调用uploadDeviceInfo
        for (const device of devices) {
            await uploadDeviceInfo(device);
        }
    },

    // 删除场景（软删除）
    deleteScene: async (req, res) => {
        try {
            const { id } = req.params;
            await pool.query('UPDATE scene_info SET del_flag = 1 WHERE id = ?', [id]);
            
            // 同时删除该房间的所有用户关联
            await pool.query('UPDATE scene_user_info SET del_flag = 1 WHERE scene_id = ?', [id]);
            
            res.json({ message: '场景删除成功' });
        } catch (error) {
            res.status(500).json({ message: '删除场景失败', error: error.message });
        }
    },

    // 获取单个场景详情
    getSceneById: async (req, res) => {
        try {
            const { id } = req.params;
            const [rows] = await pool.query('SELECT * FROM scene_info WHERE id = ? AND del_flag = 0', [id]);
            if (rows.length === 0) {
                return res.status(404).json({ message: '场景不存在' });
            }
            res.json(rows[0]);
        } catch (error) {
            res.status(500).json({ message: '获取场景详情失败', error: error.message });
        }
    },

    // 获取所有场景列表（不分页，用于分配功能）
    getAllScenes: async (req, res) => {
        try {
            const [rows] = await pool.query(
                'SELECT id, name FROM scene_info WHERE del_flag = 0 ORDER BY id DESC'
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