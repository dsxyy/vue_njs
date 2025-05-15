create table if not exists device_history
(
    id          int auto_increment
        primary key,
    deviceId    varchar(255) null,
    currentTime varchar(255) null,
    weight      varchar(255) null
)
    row_format = DYNAMIC;

create table if not exists device_info
(
    id            int auto_increment
        primary key,
    name          varchar(255)                           null,
    port          varchar(255)                           null,
    status        int                                    null comment '1是在线，2是离线',
    radarHeight   varchar(20)                            null,
    downAngle     varchar(255)                           null,
    bandWidth     varchar(20)                            null,
    nframes       varchar(255)                           null,
    mac           varchar(255)                           null,
    showAble      int                                    null,
    version       varchar(255)                           null,
    isUpdate      int(1) unsigned zerofill default 0     null,
    percentage    int unsigned             default '100' not null,
    bgimg         varchar(255)                           null,
    sceneId       int                                    null,
    azi_angle     varchar(255)                           null,
    x_location    decimal(4, 2)                          null,
    y_location    decimal(4, 2)                          null,
    deltaX_room   decimal(4, 2)                          null,
    deltaY_room   decimal(4, 2)                          null,
    radar_version int                                    null
)
    row_format = DYNAMIC;

create table if not exists device_warns
(
    starttime   varchar(255) null,
    endtime     varchar(255) null,
    deviceid    varchar(255) null,
    content     varchar(255) null,
    currenttime varchar(255) null
)
    row_format = DYNAMIC;

create table if not exists scene_info
(
    id               int auto_increment
        primary key,
    name             varchar(255)  null,
    room_x_length    decimal(4, 2) null,
    room_y_length    decimal(4, 2) null,
    emergencyContact varchar(255)  null
)
    row_format = DYNAMIC;

create table if not exists scene_user_info
(
    id       int auto_increment
        primary key,
    scene_id int null,
    userid   int null
)
    row_format = DYNAMIC;

create table if not exists sys_user_info
(
    id       int auto_increment
        primary key,
    name     varchar(255) null,
    password varchar(255) null
)
    row_format = DYNAMIC;

create table if not exists user_device
(
    id           int auto_increment
        primary key,
    userId       int      not null,
    deviceId     int      not null,
    userDeviceId char(11) null
)
    collate = utf8mb4_general_ci
    row_format = DYNAMIC;

create index FIRST_INDEX
    on user_device (userId, deviceId);

create table if not exists user_info
(
    id                 int auto_increment
        primary key,
    name               varchar(255)  null,
    phone              varchar(255)  null,
    association_device varchar(255)  null,
    shareAccount       varchar(5000) null,
    parentId           varchar(100)  null,
    privileges         int default 1 not null comment '0管理员，1普通用户，2已申请，3被拒绝',
    showable           int default 1 not null comment '1表示可用，2表示删除'
)
    row_format = DYNAMIC;

create table if not exists version_info
(
    id          int auto_increment
        primary key,
    versionName varchar(255) null,
    description varchar(255) null,
    fileUrl     varchar(255) null,
    createTime  varchar(255) null
)
    row_format = DYNAMIC;

