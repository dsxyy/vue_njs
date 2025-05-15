import mysql.connector
import argparse
import json
from datetime import datetime
import os
import requests

# 多环境数据库配置（从database.js移植）
database_config = {
    'local': {
        'host': '127.0.0.1',
        'port': 3306,
        'user': 'inchi',
        'password': 'inchi@123',
        'database': 'pose'
    },
    'dev': {
        'host': '172.16.20.202',
        'port': 3306,
        'user': 'inchi',
        'password': 'inchi@123',
        'database': 'pose'
    },
    'prod': {
        'host': '10.1.12.144',
        'port': 13306,
        'user': 'inchi',
        'password': 'inchi@123',
        'database': 'pose'
    }
}

# 通用连接参数
connection_params = {
    'charset': 'utf8',
    'buffered': True,
    'connect_timeout': 5
}

# 支持多环境切换
def get_fileurls(env='prod'):
    try:
        # 合并环境配置和通用参数
        db_config = {**database_config[env], **connection_params}
        
        # 创建数据库连接
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()

        # 执行查询
        query = "SELECT fileUrl FROM version_info"
        cursor.execute(query)

        # 获取结果并格式化
        results = []
        for row in cursor.fetchall():
            original_url = row[0]
            filename = os.path.basename(original_url)
            results.append({'original_url': original_url, 'filename': filename, 'status': 'pending'})

        # 生成带时间戳的文件名
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_file = f'fileurls_{timestamp}.json'

        # 创建资源目录
        os.makedirs('resource', exist_ok=True)

        # 下载文件并更新状态
        for result in results:
            try:
                response = requests.get(f'http://mmradar.inchitech.com/resource/{result["filename"]}', timeout=10)
                response.raise_for_status()
                with open(f'resource/{result["filename"]}', 'wb') as f:
                    f.write(response.content)
                result['status'] = 'success'
            except requests.RequestException as e:
                result['status'] = f'failed: {str(e)}'

        # 保存结果到JSON文件
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)

        print(f'成功获取 {len(results)} 条fileUrl，结果已保存至: {output_file}')

    except mysql.connector.Error as err:
        print(f'数据库错误: {err}')
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == '__main__':
    # 配置命令行参数
    parser = argparse.ArgumentParser(description='获取版本文件URL')
    parser.add_argument('--env', 
                        choices=['local', 'dev', 'prod'],
                        default='prod',
                        help='数据库环境（默认: prod）')
    args = parser.parse_args()
    
    get_fileurls(args.env)