from flask import Flask, request, jsonify
import os
import tarfile
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
UPLOAD_FOLDER = './radar_data'  # 指定上传目录
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
# 上传文件
@app.route('/uploads', methods=['POST', 'PUT'])
def upload_file():
    logging.info("Request files: %s", request.files)  # Debugging line
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    # Parse filename to get radar_id (15 chars) and date
    try:
        if not file.filename.endswith('.tar.gz'):
            raise ValueError("File must be .tar.gz format")
            
        filename_parts = file.filename.split('-', 3)  # Split into max 4 parts
        if len(filename_parts) < 4:
            raise ValueError("Invalid filename format. Expected: radarid-year-month-day.tar.gz")
            
        radar_id = filename_parts[0]
        if len(radar_id) != 15:
            raise ValueError("Radar ID must be 15 characters")
            
        date_str = '-'.join(filename_parts[1:4]).replace('.tar.gz', '')
        
        # Create radar_data directory if not exists
        os.makedirs('./radar_data', exist_ok=True)
        
        # Create target path: ./radar_data/radar_id/date.tar.gz
        file_path = os.path.join('./radar_data', radar_id, f"{date_str}.tar.gz")
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
    except Exception as e:
        logging.error(f"Filename parsing error: {str(e)}")
        return jsonify({'error': 'Invalid filename format. Expected: deviceid-year-month-day.tar'}), 400

    # Initialize resume_from
    resume_from = 0

    # Handle resume upload
    if os.path.exists(file_path):
        resume_from = os.path.getsize(file_path)
        file.seek(resume_from)
        logging.info("Resuming upload from byte: %d", resume_from)

    with open(file_path, 'wb') as f:
        total_size = request.content_length
        uploaded_size = 0

        logging.info("Starting upload of %s (Total size: %d bytes)", file.filename, total_size)

        while True:
            chunk = file.read(4096)  # Read 4KB at a time
            if not chunk:
                break
            f.write(chunk)
            uploaded_size += len(chunk)
            # logging.info('Uploaded %d of %d bytes (%.2f%%)', uploaded_size, total_size, (uploaded_size / total_size) * 100)

    logging.info("Upload completed for %s. Total uploaded size: %d bytes.", file.filename, uploaded_size)
    return jsonify({'message': 'File uploaded successfully'}), 200
# 解压文件
@app.route('/extract', methods=['POST'])
def extract_file():
    tar_file_path = os.path.join(UPLOAD_FOLDER, request.json['filename'])
    if not os.path.exists(tar_file_path):
        return jsonify({'error': 'File not found'}), 404

    with tarfile.open(tar_file_path, 'r:') as tar:
        tar.extractall(path=UPLOAD_FOLDER)

    return jsonify({'message': 'File extracted successfully'}), 200

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0",port=8088)