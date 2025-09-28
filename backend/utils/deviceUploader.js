const axios = require('axios');
const pool = require('../config/database');
const params = require('../config/params');
/**
 * 上传设备信息到智能实验室系统
 * @param {string} mac - 设备MAC地址
 */
async function uploadDeviceInfo(mac) {
    try {
        // 根据mac查询设备信息
        const [rows] = await pool.query(
            'SELECT * FROM device_info WHERE mac = ?',
            [mac]
        );
        
        if (rows.length === 0) {
            console.error('未找到MAC地址为', mac, '的设备');
            return;
        }
        
        const deviceInfo = rows[0];
        
        // 将设备信息的每个值转换为字符串，当值为 null 或空时返回 ""
        const stringifiedParams = {};
        for (let key in deviceInfo) {
            if (deviceInfo.hasOwnProperty(key)) {
                if (deviceInfo[key] === null || deviceInfo[key] === '') {
                    stringifiedParams[key] = "";
                } else {
                    stringifiedParams[key] = String(deviceInfo[key]);
                }
            }
        }
        
        console.log('/smartlab/control/adddevice')
        console.log('stringifiedParams:', stringifiedParams);

        const url = params.PROXY_URL + `/smartlab/control/adddevice`;
        return axios.post(url, stringifiedParams)
            .then(response => {
                console.log('设备信息上传成功:', response.data);
                return response.data;
            })
            .catch(error => {
                console.error('设备信息上传失败:', error.message);
            });
    } catch (error) {
        console.error('上传设备信息失败', error);
    }
}
/**
 * 获取雷达回放数据
 * @param params 回放需要的参数deviceID，datetime
 * @param params.deviceID 回放的序列号
 * @param params.deatetime 拷贝的回放日期 日期格式为YYYY-M-DD
 * @param params.url 上传URL
 */
function getDeviceReplayData(requestParams) {
    try {
        console.log('/smartlab/control/upload');
        requestParams.url = params.UPLOAD_URL;
        const url = params.PROXY_URL + '/smartlab/control/upload';
        console.log('Request params:', requestParams);
        
        return axios.post(url, requestParams)
            .then(response => {
                console.log('设备回放数据请求成功:', response.data);
                return response.data;
            })
            .catch(error => {
                console.error('设备回放数据请求失败:', error.message);
            });
    } catch (error) {
        console.error('获取设备回放数据失败', error);
    }
}

module.exports = {
    uploadDeviceInfo,
    getDeviceReplayData
};