const PARAMS = {
    ACCESS_URL : "http://localhost:5100",
    PROXY_URL : "http://172.16.30.12:8099", // 谭老师服务器url
    UPLOAD_URL : "http://172.16.30.12:8088/uploads", // 谭老师服务器上传url
    ALLOWED_IPS : [
        "localhost",
        "172.16.30.12",
        "test.mmradar.inchitech.com",
        "mmradar.inchitech.com"
    ]
}

module.exports = PARAMS