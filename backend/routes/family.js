const express = require('express');
const router = express.Router();
const familyController = require('../controllers/familyController');

// 获取所有家庭列表（分页、搜索）
router.get('/', familyController.getFamilies);

// 获取所有家庭列表（不分页，用于分配功能）
router.get('/all', familyController.getAllFamilies);

// 创建新家庭
router.post('/', familyController.createFamily);
// 更新家庭信息
router.put('/:id', familyController.updateFamily);
// 删除家庭
router.delete('/:id', familyController.deleteFamily);
// 获取单个家庭详情
router.get('/:id', familyController.getFamilyById);
// 获取家庭成员（含创建者/共享者）
router.get('/:id/users', familyController.getFamilyUsers);
// 更新家庭成员（共享者）
router.post('/:id/users', familyController.updateFamilyUsers);

module.exports = router; 