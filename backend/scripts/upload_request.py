import argparse
import requests
import sys
import json
import mysql.connector
'''
python upload_request.py --datetime 2025-07-22
脚本实现某一天的设备数据上传请求，需要传入日期参数，日期格式为YYYY-MM-DD
脚本会从数据库中获取所有在线设备，并发送上传请求
上传请求的URL为http://10.1.12.144:8099/smartlab/control/upload
上传请求的参数为deviceID, datetime, url
deviceID为设备ID
datetime为日期时间
url为上传URL
'''
database_config = {
    'host': '10.1.12.144',
    'port': 13306,
    'user': 'inchi',
    'password': 'inchi@123',
    'database': 'pose'    
}
# 通用连接参数
connection_params = {
    'charset': 'utf8',
    'buffered': True,
    'connect_timeout': 5
}
def main():
    # 设置命令行参数解析
    parser = argparse.ArgumentParser(description='发送数据上传请求')
    parser.add_argument('--datetime', required=True, help='日期时间 (格式: YYYY-M-D)')
    args = parser.parse_args()
    try:
        # 合并环境配置和通用参数
        db_config = {**database_config, **connection_params}
        
        # 创建数据库连接
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()

        # 执行查询
        query = "SELECT id, mac FROM device_info WHERE status = 1 AND showAble = 1"
        cursor.execute(query)

        # 获取设备ID列表
        device_macs = [row[1] for row in cursor.fetchall()]

        if not device_macs:
            print("没有找到设备ID")
            sys.exit(1)

        # 选择第一个设备ID作为示例
        for device_macs in device_macs:
            print(f"正在处理设备ID: {device_macs}")
            # 发送上传请求
            send_upload_request(device_macs, args.datetime)
    except mysql.connector.Error as err:
        print(f'数据库错误: {err}')
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()
def send_upload_request(device_id, datetime_str):
    # 请求URL和固定参数
    url = "http://10.1.12.144:8099/smartlab/control/upload"
    payload = {
        "deviceID": device_id,
        "datetime": datetime_str,
        "url": "http://218.94.159.100:8088/uploads"
    }
    
    try:
        # 发送POST请求
        response = requests.post(url, json=payload)
        response.raise_for_status()  # 检查HTTP错误
        
        # 打印响应信息
        print("请求成功！")
        print(f"状态码: {response.status_code}")
        print("响应内容:")
        print(json.dumps(response.json(), indent=2))
        
    except requests.exceptions.RequestException as e:
        print(f"请求失败: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()