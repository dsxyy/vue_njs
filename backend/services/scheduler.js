const cron = require('node-cron');
const pool = require('../config/database');
const deviceUploader = require('../utils/deviceUploader');
const fs = require('fs');
const path = require('path');
/**
 * 每天半夜12点半和1点半获取在线设备前一天的数据
 * 如果已经有数据了就不用再请求了
 */
class DeviceDataScheduler {
    constructor() {
        this.init();
    }

    init() {
        // 每天半夜12点半执行
        cron.schedule('30 0 * * *', () => {
            console.log('开始执行定时任务(12:30): 下载设备数据');
            this.downloadYesterdayData();
        });

        // 每天半夜1点半执行
        cron.schedule('30 1 * * *', () => {
            console.log('开始执行定时任务(1:30): 下载设备数据');
            this.downloadYesterdayData();
        });
    }

    /**
     * 检查设备数据是否已存在
     * @param {string} deviceMac 设备MAC地址
     * @param {string} dateStr 日期字符串 (YYYY-M-DD)
     * @returns {boolean} 数据是否存在
     */
    checkDataExists(deviceMac, dateStr) {
        try {
            // 构建数据文件路径
            const dataDir = path.join(__dirname, '../radarData/radar_data');
            const deviceDir = path.join(dataDir, deviceMac);
            const dataFile = path.join(deviceDir, `${dateStr}.tar.gz`);
            
            // 检查文件是否存在
            return fs.existsSync(dataFile);
        } catch (error) {
            console.error(`检查数据文件是否存在时出错:`, error);
            return false;
        }
    }

    async downloadYesterdayData() {
        try {
            // 获取所有在线设备
            const [devices] = await pool.query(
                'SELECT id, mac FROM device_info WHERE status = 1 AND showAble = 1'
            );

            if (devices.length === 0) {
                console.log('没有在线的设备');
                return;
            }

            // 计算前一天的日期 (YYYY-M-DD)
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const dateStr = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`;

            console.log(`开始处理日期: ${dateStr} 的设备数据`);

            // 为每个设备下载前一天的数据
            for (const device of devices) {
                try {
                    // 检查数据是否已存在
                    if (this.checkDataExists(device.mac, dateStr)) {
                        console.log(`设备 ${device.mac} (ID: ${device.id}) 的数据已存在，跳过下载`);
                        continue;
                    }

                    console.log(`正在下载设备 ${device.mac} (ID: ${device.id}) 的数据，日期: ${dateStr}`);
                    await deviceUploader.getDeviceReplayData({
                        deviceID: device.mac,
                        datetime: dateStr
                    });
                } catch (error) {
                    console.error(`下载设备 ${device.mac} 数据失败:`, error.message);
                }
            }

            console.log('所有设备数据下载任务完成');
        } catch (error) {
            console.error('定时任务执行失败:', error);
        }
    }
}

// 启动定时任务服务
new DeviceDataScheduler();

module.exports = DeviceDataScheduler;