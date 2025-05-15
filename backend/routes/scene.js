const express = require('express');
const router = express.Router();
const sceneController = require('../controllers/sceneController');

// 获取所有场景列表（不分页）
router.get('/all', sceneController.getAllScenes);

// 批量获取场景用户信息
router.post('/users/batch', sceneController.getScenesUsersBatch);

// 获取场景列表（带分页）
router.get('/', sceneController.getScenes);

// 创建新场景
router.post('/', sceneController.createScene);

// 更新场景信息
router.put('/:id', sceneController.updateScene);

// 删除场景
router.delete('/:id', sceneController.deleteScene);

// 获取单个场景详情
router.get('/:id', sceneController.getSceneById);

// 获取场景的用户列表
router.get('/:id/users', sceneController.getSceneUsers);

// 更新场景的用户列表
router.post('/:id/users', sceneController.updateSceneUsers);

// 获取场景内的设备列表
router.get('/:id/devices', sceneController.getSceneDevices);

module.exports = router; 