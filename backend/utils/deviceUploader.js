const axios = require('axios');
const proxy_url = 'http://10.1.12.144:8099';
const upload_url = 'http://218.94.159.100:8088/uploads'
/**
 * 上传设备信息到智能实验室系统
 * @param {Object} params - 设备参数对象
 */
function uploadDeviceInfo(params) {
    try {
        // 将 params 的每个值转换为字符串，当值为 null 或空时返回 ""
        const stringifiedParams = {};
        for (let key in params) {
            if (params.hasOwnProperty(key)) {
                if (params[key] === null || params[key] === '') {
                    stringifiedParams[key] = "";
                } else {
                    stringifiedParams[key] = String(params[key]);
                }
            }
        }
        console.log('/smartlab/control/adddevice')
        console.log('stringifiedParams:', stringifiedParams);

        const url = proxy_url + `/smartlab/control/adddevice`;
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
function getDeviceReplayData(params) {
    try {
        console.log('/smartlab/control/upload');
        params.url = upload_url;
        const url = proxy_url + '/smartlab/control/upload';
        console.log('Request params:', params);
        
        return axios.post(url, params)
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