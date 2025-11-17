package com.inchitech.radar.service;

import com.inchitech.radar.config.ProxyProperties;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class DataArchiveService {

    private final Path radarDataRoot;

    public DataArchiveService(ProxyProperties proxyProperties) throws IOException {
        this.radarDataRoot = Paths.get(proxyProperties.getRadarDataRoot()).toAbsolutePath().normalize();
        Files.createDirectories(this.radarDataRoot);
    }

    public Path getRadarDataRoot() {
        return radarDataRoot;
    }

    public Path resolveDeviceFile(String deviceId, String date) throws IOException {
        Path deviceDir = radarDataRoot.resolve(deviceId);
        Files.createDirectories(deviceDir);
        return deviceDir.resolve(date + ".tar.gz");
    }
}
