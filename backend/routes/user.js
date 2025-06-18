const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// // 验证码路由
// router.get('/captcha', userController.getCaptcha);

// 登录路由
router.post('/login', userController.login);

// 基础用户路由
router.get('/', userController.getUsers);
router.get('/all', userController.getAllUsers);
router.post('/', userController.createUser);

// 带ID的用户路由
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.get('/:id/assigned', userController.getAssignedUsers);
router.post('/:id/assign', userController.updateUserAssignment);

module.exports = router; 