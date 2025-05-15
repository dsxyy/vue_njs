const express = require('express');
const router = express.Router();
const versionController = require('../controllers/versionController');

// 获取版本列表
router.get('/', versionController.getVersions);

// 上传版本文件
router.post('/upload', versionController.uploadVersionFile);

// 创建新版本
router.post('/', versionController.createVersion);

// 更新版本信息
router.put('/:id', versionController.updateVersion);

// 删除版本
router.delete('/:id', versionController.deleteVersion);

// 获取单个版本详情
router.get('/:id', versionController.getVersionById);

// // 下载版本文件
// router.get('/download/:fileName', versionController.downloadVersionFile);

module.exports = router;