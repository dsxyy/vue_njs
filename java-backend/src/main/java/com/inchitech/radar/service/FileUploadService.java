package com.inchitech.radar.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@Service
public class FileUploadService {

    private final DataArchiveService dataArchiveService;

    public FileUploadService(DataArchiveService dataArchiveService) {
        this.dataArchiveService = dataArchiveService;
    }

    public Path storeReplayFile(MultipartFile file) throws IOException {
        String original = file.getOriginalFilename();
        if (original == null || original.isBlank()) {
            throw new IllegalArgumentException("缺少文件名");
        }
        if (!original.endsWith(".tar.gz")) {
            throw new IllegalArgumentException("文件必须为 .tar.gz");
        }
        String[] parts = original.split("-");
        if (parts.length < 4) {
            throw new IllegalArgumentException("文件名格式应为 deviceid-year-month-day.tar.gz");
        }
        String deviceId = parts[0];
        if (deviceId.length() != 15) {
            throw new IllegalArgumentException("设备ID长度必须为15位");
        }
        String date = parts[1] + "-" + parts[2] + "-" + parts[3].replace(".tar.gz", "");
        Path target = dataArchiveService.resolveDeviceFile(deviceId, date);
        Files.copy(file.getInputStream(), target);
        return target;
    }
}
