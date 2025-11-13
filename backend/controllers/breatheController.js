const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createCaptcha, verifyCaptcha } = require('../utils/captcha');
const { getCountryCode } = require('../utils/countryCodeMap');

const breatheController = {

    // 创建新设备
    createDevice: async (req, res) => {
        try {
            // 从请求体中解构所有相关字段
            const { name, device_id, width, heigth, status,
                    text1, text2, text3, text4, text5, text6, text7, text8 } = req.body;

            // 基础验证
            if (!name || !device_id) {
                return res.status(400).json({
                    code: 400,
                    message: '名称(name)和设备ID(device_id)是必需的'
                });
            }

            // 插入新设备，del_flag 默认为 0 (未删除)
            const [result] = await pool.query(
                `INSERT INTO breath_heart_device_info 
                 (name, device_id, width, heigth, status, 
                  text1, text2, text3, text4, text5, text6, text7, text8, 
                  del_flag) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
                [name, device_id, width, heigth, status,
                 text1, text2, text3, text4, text5, text6, text7, text8]
            );

            res.status(201).json({
                code: 201,
                message: '呼吸心跳设备创建成功',
                data: { id: result.insertId }
            });

        } catch (error) {
            console.error('创建呼吸心跳设备失败:', error);
            // 处理 device_id 唯一的约束
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    code: 409,
                    message: '创建失败: device_id 已存在',
                    error: error.message
                });
            }
            res.status(500).json({ 
                code: 500,
                message: '创建呼吸心跳设备失败', 
                error: error.message 
            });
        }
    },

    // 更新设备信息
    updateDevice: async (req, res) => {
        try {
            const { id } = req.params;
            
            // 解构所有可更新的字段
            const { name, width, heigth, status,
                    text1, text2, text3, text4, text5, text6, text7, text8 } = req.body;
            
            // 不更新 device_id，因为它是一个唯一的业务键。
            // 如果也需要更新 device_id，请确保处理 ER_DUP_ENTRY 错误。

            const [result] = await pool.query(
                `UPDATE breath_heart_device_info SET
                    name = ?,
                    width = ?,
                    heigth = ?,
                    status = ?,
                    text1 = ?,
                    text2 = ?,
                    text3 = ?,
                    text4 = ?,
                    text5 = ?,
                    text6 = ?,
                    text7 = ?,
                    text8 = ?
                 WHERE id = ? AND del_flag = 0`, // 确保只更新未删除的
                [name, width, heigth, status,
                 text1, text2, text3, text4, text5, text6, text7, text8,
                 id]
            );

            // 检查是否真的更新了
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    code: 404,
                    message: '设备不存在或已被删除'
                });
            }

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

    // 删除设备（软删除）
    deleteDevice: async (req, res) => {
       try {
            const { id } = req.params;
            
            // 执行软删除：将 del_flag 设置为 1
            const [result] = await pool.query(
                'UPDATE breath_heart_device_info SET del_flag = 1 WHERE id = ? AND del_flag = 0',
                [id]
            );

            // 检查是否真的删除了（或该记录是否存在）
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    code: 404,
                    message: '设备不存在或已被删除'
                });
            }

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

    // 获取单个用户详情
    getDeviceById: async (req, res) => {
        try {
            const { id } = req.params;
            
            // 查询时确保 del_flag = 0
            const [rows] = await pool.query(
                'SELECT * FROM breath_heart_device_info WHERE id = ? AND del_flag = 0',
                [id]
            );
            
            if (rows.length === 0) {
                return res.status(404).json({
                    code: 404,
                    message: '设备不存在或已被删除'
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



    // 获取所有用户列表（不分页，用于分配功能）
    getAllDevices: async (req, res) => {
        try {
            // 1. 分页参数
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 10;
            const offset = (page - 1) * pageSize;

            // 2. 搜索参数 (根据新表 schema 调整)
            const { device_id, name } = req.query; // 使用 device_id 代替 mac
            let whereClause = 'WHERE d.del_flag = 0'; // 使用 del_flag = 0
            const queryParams = [];
            
            if (device_id) {
                whereClause += ' AND d.device_id LIKE ?'; // 搜索 device_id
                queryParams.push(`%${device_id}%`);
            }
            
            if (name) {
                whereClause += ' AND d.name LIKE ?';
                queryParams.push(`%${name}%`);
            }

            // 3. 获取总记录数
            const [countResult] = await pool.query(
                `SELECT COUNT(*) as total
                 FROM breath_heart_device_info d
                 ${whereClause}`,
                queryParams
            );
            const total = parseInt(countResult[0].total) || 0;

            // 4. 获取分页数据 (移除了原有的 JOIN)
            const [rows] = await pool.query(
                `SELECT d.*
                 FROM breath_heart_device_info d
                 ${whereClause}
                 ORDER BY d.status asc , d.id DESC
                 LIMIT ? OFFSET ?`,
                [...queryParams, pageSize, offset]
            );
            
            // 5. 成功响应
            res.json({
                code: 200,
                message: '获取呼吸心跳设备列表成功',
                data: {
                    items: rows,
                    total: total
                }
            });
        } catch (error) {
            console.error('获取呼吸心跳设备列表失败:', error);
            res.status(500).json({ 
                code: 500,
                message: '获取呼吸心跳设备列表失败', 
                error: error.message 
            });
        }
    },

   
};

module.exports = breatheController;