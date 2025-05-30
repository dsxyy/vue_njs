const express = require('express');
const cors = require('cors');
const path = require('path');
const versionRoutes = require('./routes/version');
const sceneRoutes = require('./routes/scene');
const userRoutes = require('./routes/user');
const deviceRouter = require('./routes/device');
const params = require('./config/params');

const app = express();

// 中间件
app.use(cors({
  origin: `${params.ACCESS_URL}`,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 设置请求体解析
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 设置静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', `${params.ACCESS_URL}`);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// 路由
app.use('/api/versions', versionRoutes);
app.use('/api/scenes', sceneRoutes);
app.use('/api/users', userRoutes);
app.use('/api/devices', deviceRouter);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    code: 500,
    message: '服务器内部错误'
  });
});

module.exports = app;

// 初始化定时任务服务
require('./services/scheduler');

const PORT = process.env.PORT || 5150;
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
});