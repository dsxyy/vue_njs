import argparse
import requests
import sys
import json
'''
测试用，add by suihaoran on 2025-07-22
'''
def main():
    # 留出IP和参数
    url = "http://10.1.12.144:8099/smartlab/control/upload"  # TODO: 替换为实际IP和端口
    payload = {
        "deviceID": 'QG9JOARJBV0CWYG',
        "datetime": '2025-8-5',
        "url": "http://218.94.159.100:8088/uploads"  # TODO: 替换为实际上传URL
    }

    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        print("请求成功！")
        print(f"状态码: {response.status_code}")
        print("响应内容:")
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    except requests.exceptions.RequestException as e:
        print(f"请求失败: {str(e)}")
        sys.exit(1)
    


if __name__ == '__main__':
    main()