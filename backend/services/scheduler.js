const cron = require('node-cron');
const pool = require('../config/database');
const deviceUploader = require('../utils/deviceUploader');
/**
 * 每天半夜12点半前获取在线设备的前一天的数据
 */
class DeviceDataScheduler {
    constructor() {
        this.init();
    }

    init() {
        // 每天半夜12点半执行
        cron.schedule('30 0 * * *', () => {
            console.log('开始执行定时任务: 下载设备数据');
            this.downloadYesterdayData();
        });
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

            // 为每个设备下载前一天的数据
            for (const device of devices) {
                try {
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