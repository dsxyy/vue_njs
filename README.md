# 智能姿态管理系统

## 项目概述
基于Vue3+Node.js开发的智能人体姿态分析管理系统，包含设备管理、场景配置、用户权限等模块。采用前后端分离架构，前端使用Element Plus组件库，后端基于Express框架实现RESTful API。

## 环境要求
- Node.js 16+
- MySQL 5.7+
- PM2 4.0+（生产环境）

## 安装步骤
```bash
# 克隆项目
git clone <仓库地址>

# 后端依赖安装
cd vue_njs/backend
npm install

# 前端依赖安装
cd ../frontend
npm install
```

## 数据库配置
1. 创建名为`pose`的数据库
2. 导入`backend/pose.sql`文件
3. 修改`backend/config/database.js`中对应环境的配置：
   - local: 本地开发环境
   - dev: 测试环境
   - prod: 生产环境

## 运行命令
### 后端服务
```bash
# 开发模式（带热重载）
npm run dev

# 生产部署
npm run start

# PM2管理
npm run restart  # 重启服务
npm run logs    # 查看日志
```

### 前端服务
```bash
# 进入前端目录
cd frontend

# 开发模式
npm run dev

# 生产构建
npm run build

# PM2进程守护
npm run pm2:start
```

## 项目结构
```
├── backend/           # 后端源码
│   ├── config/        # 数据库配置
│   ├── controllers/   # 业务逻辑层
│   ├── routes/        # 路由定义
│   ├── pose.sql       # 数据库初始化脚本
│   └── ecosystem.config.js # PM2配置
├── frontend/          # 前端源码
│   ├── src/          
│   │   ├── views/    # 页面组件
│   │   └── router/   # 前端路由
└── .gitignore
└── README.md
```

## 注意事项
1. 密码加密策略见`utils/password.js`
2. 文件上传限制配置在`middleware/auth.js`