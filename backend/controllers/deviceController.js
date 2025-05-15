const pool = require('../config/database');

const deviceController = {
    // 获取设备列表
    getDevices: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 10;
            const offset = (page - 1) * pageSize;

            // 获取总记录数
            const [countResult] = await pool.query(
                'SELECT COUNT(*) as total FROM device_info WHERE showAble = 1'
            );
            const total = parseInt(countResult[0].total) || 0;

            // 获取分页数据，并关联场景信息
            const [rows] = await pool.query(
                `SELECT d.*, s.name as scene_name 
                FROM device_info d 
                LEFT JOIN scene_info s ON d.sceneId = s.id 
                WHERE d.showAble = 1 
                ORDER BY d.status asc , d.id DESC 
                LIMIT ? OFFSET ?`,
                [pageSize, offset]
            );
            
            res.json({
                code: 200,
                message: '获取设备列表成功',
                data: {
                    items: rows,
                    total: total
                }
            });
        } catch (error) {
            console.error('获取设备列表失败:', error);
            res.status(500).json({ 
                code: 500,
                message: '获取设备列表失败', 
                error: error.message 
            });
        }
    },

    // 创建新设备
    createDevice: async (req, res) => {
        try {
            const { name, mac, radarHeight, downAngle, sceneId, deltaX_room, deltaY_room } = req.body;

            const [result] = await pool.query(
                `INSERT INTO device_info (
                    name, mac, radarHeight, downAngle, status, showAble,
                    port, bandWidth, nframes, version, isUpdate, percentage,
                    bgimg, sceneId, azi_angle, x_location, y_location,
                    deltaX_room, deltaY_room, radar_version
                ) VALUES (?, ?, ?, ?, 1, 1, '', '', '', '', 0, 100, '', ?, '', 0, 0, ?, ?, 1)`,
                [name, mac, radarHeight, downAngle, sceneId, deltaX_room, deltaY_room]
            );

            res.status(201).json({
                code: 200,
                message: '设备创建成功',
                data: { id: result.insertId }
            });
        } catch (error) {
            console.error('创建设备失败:', error);
            res.status(500).json({ 
                code: 500,
                message: '创建设备失败', 
                error: error.message 
            });
        }
    },

    // 更新设备信息
    updateDevice: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, radarHeight, downAngle } = req.body;

            await pool.query(
                `UPDATE device_info SET 
                    name = ?, radarHeight = ?, downAngle = ?
                WHERE id = ?`,
                [name, radarHeight, downAngle, id]
            );

            res.json({
                code: 200,
                message: '设备更新成功'
            });
        } catch (error) {
            console.error('更新设备失败:', error);
            res.status(500).json({ 
                code: 500,
                message: '更新设备失败', 
                error: error.message 
            });
        }
    },

    // 删除设备
    deleteDevice: async (req, res) => {
        try {
            const { id } = req.params;
            await pool.query(
                'UPDATE device_info SET showAble = 2 WHERE id = ?',
                [id]
            );
            res.json({
                code: 200,
                message: '设备删除成功'
            });
        } catch (error) {
            console.error('删除设备失败:', error);
            res.status(500).json({ 
                code: 500,
                message: '删除设备失败', 
                error: error.message 
            });
        }
    },

    // 获取单个设备详情
    getDeviceById: async (req, res) => {
        try {
            const { id } = req.params;
            const [rows] = await pool.query(
                'SELECT * FROM device_info WHERE id = ? AND showAble = 1',
                [id]
            );
            
            if (rows.length === 0) {
                return res.status(404).json({
                    code: 404,
                    message: '设备不存在'
                });
            }

            res.json({
                code: 200,
                message: '获取设备详情成功',
                data: rows[0]
            });
        } catch (error) {
            console.error('获取设备详情失败:', error);
            res.status(500).json({ 
                code: 500,
                message: '获取设备详情失败', 
                error: error.message 
            });
        }
    }
};

module.exports = deviceController; 