const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');

// 获取设备列表
router.get('/', deviceController.getDevices);

// 创建新设备
router.post('/', deviceController.createDevice);

// 获取单个设备
router.get('/:id', deviceController.getDeviceById);

// 更新设备
router.put('/:id', deviceController.updateDevice);

// 删除设备
router.delete('/:id', deviceController.deleteDevice);

module.exports = router;