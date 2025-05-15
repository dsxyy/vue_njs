const pool = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const RESOURCE_URL = require('../config/params');

// 配置文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/versions';
        // 确保上传目录存在
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // 生成文件名：时间戳 + 原始文件名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 限制文件大小为50MB
    },
    fileFilter: function (req, file, cb) {
        // 只允许上传特定类型的文件
        const allowedTypes = ['.bin', '.zip', '.rar', '.7z'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('不支持的文件类型'));
        }
    }
}).single('file');

const versionController = {
    // 获取版本列表
    getVersions: async (req, res) => {
        try {
            // 构建搜索条件
            const { name, page = 1, limit = 10 } = req.query;
            let whereClause = '';
            const params = [];
            
            if (name) {
                whereClause = 'WHERE versionName LIKE ?';
                params.push(`%${name}%`);
            }

            // 计算分页
            const offset = (page - 1) * limit;

            // 获取总数
            const [countResult] = await pool.query(
                `SELECT COUNT(*) as total FROM version_info ${whereClause}`,
                params
            );
            const total = countResult[0].total;

            // 获取分页数据
            const [rows] = await pool.query(
                `SELECT * FROM version_info ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
                [...params, parseInt(limit), offset]
            );
            
            res.json({
                code: 200,
                message: '获取版本列表成功',
                data: rows,
                total: total
            });
        } catch (error) {
            console.error('获取版本列表失败:', error);
            res.status(500).json({ 
                code: 500,
                message: '获取版本列表失败', 
                error: error.message 
            });
        }
    },

    // 上传版本文件
    uploadVersionFile: async (req, res) => {
        upload(req, res, async function(err) {
            if (err) {
                return res.status(400).json({
                    code: 400,
                    message: '文件上传失败',
                    error: err.message
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    code: 400,
                    message: '请选择要上传的文件'
                });
            }

            try {
                // 构建正确的文件URL
                const fileUrl = `/upload/versions/${req.file.filename}`;
                
                res.json({
                    code: 200,
                    message: '文件上传成功',
                    data: {
                        fileUrl: fileUrl,
                        fileName: req.file.originalname
                    }
                });
            } catch (error) {
                console.error('文件上传处理失败:', error);
                res.status(500).json({
                    code: 500,
                    message: '文件上传处理失败',
                    error: error.message
                });
            }
        });
    },

    // 创建新版本
    createVersion: async (req, res) => {
        try {
            console.log('请求体:', req.body);
            const { versionName, description, fileUrl,fileName } = req.body;
            console.log('文件URL:', fileUrl);
            const createTime = new Date().toISOString();
            const [result] = await pool.query(
                'INSERT INTO version_info (versionName, description, fileUrl, createTime) VALUES (?, ?, ?, ?)',
                [versionName, description, fileUrl, createTime]
            );
            res.status(201).json({ 
                code: 200,
                message: '版本创建成功',
                data: { id: result.insertId }
            });
        } catch (error) {
            res.status(500).json({ 
                code: 500,
                message: '创建版本失败', 
                error: error.message 
            });
        }
    },

    // 更新版本信息
    updateVersion: async (req, res) => {
        try {
            const { id } = req.params;
            const { versionName, description, fileUrl } = req.body;
            await pool.query(
                'UPDATE version_info SET versionName = ?, description = ?, fileUrl = ? WHERE id = ?',
                [versionName, description, fileUrl, id]
            );
            res.json({ message: '版本更新成功' });
        } catch (error) {
            res.status(500).json({ message: '更新版本失败', error: error.message });
        }
    },

    // 删除版本
    deleteVersion: async (req, res) => {
        try {
            const { id } = req.params;
            await pool.query('DELETE FROM version_info WHERE id = ?', [id]);
            res.json({ message: '版本删除成功' });
        } catch (error) {
            res.status(500).json({ message: '删除版本失败', error: error.message });
        }
    },

    // 获取单个版本详情
    getVersionById: async (req, res) => {
        try {
            const { id } = req.params;
            const [rows] = await pool.query('SELECT * FROM version_info WHERE id = ?', [id]);
            if (rows.length === 0) {
                return res.status(404).json({ message: '版本不存在' });
            }
            res.json(rows[0]);
        } catch (error) {
            res.status(500).json({ message: '获取版本详情失败', error: error.message });
        }
    },

    // // 下载版本文件
    // downloadVersionFile: async (req, res) => {
    //     try {
    //         const { fileName } = req.params;
    //         // 调整路径：从 backend/controllers/ 向上两级到项目根目录，再进入 uploads/versions
    //         const filePath = path.join(__dirname, '../../uploads/versions', fileName); 
            
    //         // 检查文件是否存在（可添加日志验证路径）
    //         console.log('尝试下载文件路径:', filePath); 
    //         if (!fs.existsSync(filePath)) {
    //             return res.status(404).json({ code: 404, message: '文件不存在' });
    //         }
            
    //         // 设置响应头，触发浏览器下载
    //         res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    //         res.setHeader('Content-Type', 'application/octet-stream');
    //         res.sendFile(filePath);
    //     } catch (error) {
    //         console.error('文件下载失败:', error);
    //         res.status(500).json({ code: 500, message: '文件下载失败', error: error.message });
    //     }
    // },
};

module.exports = versionController;