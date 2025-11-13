const express = require('express');
const router = express.Router();
const breatheController = require('../controllers/breatheController');

// 增加设备
router.post('/', breatheController.createDevice);

// 删除设备
router.delete('/:id', breatheController.deleteDevice);

// 更新设备
router.put('/:id', breatheController.updateDevice);

// 获取设备
router.get('/:id', breatheController.getDeviceById);
router.get('/', breatheController.getAllDevices);

module.exports = router;