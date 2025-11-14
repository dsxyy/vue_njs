# Radar Java Backend

Java/Spring Boot 重构版本，对应原有 Node.js 服务的功能，包括：

- 管理员登录、用户管理（分页、创建、编辑、软删除、家庭关联）
- 家庭/房间/设备（含智能实验室同步）管理
- 版本包上传、CRUD
- 呼吸心跳设备管理
- 设备告警查询

## 目录结构

```
java-backend/
├── pom.xml
├── src/main/java/com/inchitech/radar
│   ├── config        # CORS、静态资源、JWT、RestTemplate 配置
│   ├── controller    # REST 接口，与 /api 路由一一对应
│   ├── dto           # 请求/响应 DTO
│   ├── integration   # 与智能实验室系统联动
│   ├── model         # 数据库实体简单映射
│   ├── repository    # JDBC 查询封装
│   └── service       # 业务逻辑
└── src/main/resources
    └── application.yml
```

## 快速开始

1. 安装 JDK 17 和 Maven 3.9+
2. 根据部署环境修改 `src/main/resources/application.yml` 中的数据库、CORS 以及代理地址
3. 在 `java-backend` 目录执行：

```bash
mvn spring-boot:run
```

服务启动后监听 `:5150`，并通过 `server.servlet.context-path=/api` 暴露与旧版一致的接口。例如登录接口仍为 `POST /api/users/login`。

## 其他说明

- 上传的固件文件保存在 `uploads/versions` 下，并通过 `/upload/**` 静态映射输出
- JWT 密钥在 `app.jwt.secret` 中配置，生产环境务必改为安全随机值
- `SmartLabClient` 会在设备配置修改后将最新数据同步至 `app.proxy.smartlab-base-url`
