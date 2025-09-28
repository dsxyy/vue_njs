const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const versionRoutes = require('./routes/version');
const sceneRoutes = require('./routes/scene');
const userRoutes = require('./routes/user');
const deviceRouter = require('./routes/device');
const familyRoutes = require('./routes/family');
const params = require('./config/params');
// const upload_server = require('./routes/upload_server');
// 后台管理服务
const app = express();

// 配置 session
app.use(session({
    secret: 'your-secret-key', // 在生产环境中使用环境变量
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false, // 改为false，因为使用HTTP
        maxAge: 30 * 60 * 1000, // 30分钟过期
        sameSite: 'none' // 允许跨域请求
    }
}));

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 动态CORS配置，支持IP白名单
app.use(cors({
    origin: function (origin, callback) {
        // 允许没有origin的请求（如移动应用）
        if (!origin) return callback(null, true);
        
        // 检查是否在允许的IP列表中
        const allowedIPs = params.ALLOWED_IPS;
        console.log(`检查CORS来源: ${origin}, 允许列表:`, allowedIPs);
        
        const isAllowed = allowedIPs.some(ip => {
            if (ip === 'localhost') {
                return origin.includes('localhost') || origin.includes('127.0.0.1');
            }
            // 支持域名匹配
            if (ip.includes('.')) {
                const result = origin.includes(ip);
                console.log(`检查域名 ${ip}: ${result}`);
                return result;
            }
            const result = origin.includes(ip);
            console.log(`检查IP ${ip}: ${result}`);
            return result;
        });
        
        console.log(`CORS检查结果: ${isAllowed}`);
        
        if (isAllowed) {
            callback(null, true);
        } else {
            console.log(`拒绝访问来源: ${origin}`);
            callback(new Error('不允许的CORS来源'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true // 允许跨域请求携带 cookie
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
app.use('/api/families', familyRoutes);

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