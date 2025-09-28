const pool = require('../config/database');
const deviceUploader = require('../utils/deviceUploader');

const deviceController = {
    // 获取设备列表
    getDevices: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 10;
            const offset = (page - 1) * pageSize;

            const { mac, name } = req.query;
            let whereClause = 'WHERE d.showAble = 1';
            const queryParams = [];
            
            if (mac) {
                whereClause += ' AND d.mac LIKE ?';
                queryParams.push(`%${mac}%`);
            }
            
            if (name) {
                whereClause += ' AND d.name LIKE ?';
                queryParams.push(`%${name}%`);
            }

            // 获取总记录数
            const [countResult] = await pool.query(
                `SELECT COUNT(*) as total
                FROM device_info d
                ${whereClause}`,
                queryParams
            );
            const total = parseInt(countResult[0].total) || 0;

            // 获取分页数据，并关联场景信息
            const [rows] = await pool.query(
                `SELECT d.*, s.name as scene_name
                FROM device_info d
                LEFT JOIN scene_info s ON d.sceneId = s.id
                ${whereClause}
                ORDER BY d.status asc , d.id DESC
                LIMIT ? OFFSET ?`,
                [...queryParams, pageSize, offset]
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


    // 更新设备信息
    updateDevice: async (req, res) => {
        try {
            const { id } = req.params;
            console.log('设备数据：',req.body)
            const { name, radarHeight, downAngle, sceneId, x_location, y_location,
                    deltaX_room, deltaY_room, is_sendMessage, wave_trigger,
                    fall_trigger, LongLayDetect, SelfCalib, language } = req.body;

            await pool.query(
                `UPDATE device_info SET
                    name = ?,
                    radarHeight = ?,
                    downAngle = ?,
                    sceneId = ?,
                    x_location = ?,
                    y_location = ?,
                    deltaX_room = ?,
                    deltaY_room = ?,
                    is_sendMessage = ?,
                    wave_trigger = ?,
                    fall_trigger = ?,
                    LongLayDetect = ?,
                    SelfCalib = ?,
                    language = ?
                WHERE id = ?`,
                [name, radarHeight, downAngle, sceneId, x_location, y_location,
                 deltaX_room, deltaY_room, is_sendMessage, wave_trigger,
                 fall_trigger, LongLayDetect, SelfCalib, language, id]
            );
            deviceUploader.uploadDeviceInfo(req.body.mac);
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
    },

    // 获取设备告警信息
    getDeviceWarns: async (req, res) => {
        try {
            const { deviceId, date } = req.query;
            
            if (!deviceId || !date) {
                return res.status(400).json({
                    code: 400,
                    message: '设备ID和日期参数不能为空'
                });
            }

            // 根据日期查询告警信息，按currenttime倒序排列
            const [rows] = await pool.query(
                `SELECT * FROM device_warns 
                WHERE deviceid = ? 
                AND DATE(currenttime) = ? 
                ORDER BY currenttime DESC`,
                [deviceId, date]
            );

            res.json({
                code: 200,
                message: '获取告警信息成功',
                data: rows
            });
        } catch (error) {
            console.error('获取告警信息失败:', error);
            res.status(500).json({ 
                code: 500,
                message: '获取告警信息失败', 
                error: error.message 
            });
        }
    },
};

module.exports = deviceController;