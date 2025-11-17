package com.inchitech.radar.integration;

import com.inchitech.radar.config.ProxyProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Component
public class SmartLabClient {

    private static final Logger log = LoggerFactory.getLogger(SmartLabClient.class);
    private final RestTemplate restTemplate;
    private final ProxyProperties proxyProperties;

    public SmartLabClient(RestTemplate restTemplate, ProxyProperties proxyProperties) {
        this.restTemplate = restTemplate;
        this.proxyProperties = proxyProperties;
    }

    public void uploadDeviceInfo(Map<String, Object> deviceInfo) {
        if (deviceInfo == null || deviceInfo.isEmpty()) {
            return;
        }
        Map<String, Object> payload = new HashMap<>();
        deviceInfo.forEach((key, value) -> payload.put(key, value == null ? "" : String.valueOf(value)));
        String url = proxyProperties.getSmartlabBaseUrl() + "/smartlab/control/adddevice";
        try {
            restTemplate.postForEntity(url, payload, String.class);
            log.info("设备信息已同步到智能实验室: {}", payload.getOrDefault("mac", "unknown"));
        } catch (Exception ex) {
            log.warn("同步设备信息失败: {}", ex.getMessage());
        }
    }

    public void requestReplay(Map<String, Object> params) {
        Map<String, Object> payload = new HashMap<>(params);
        payload.put("url", proxyProperties.getUploadBaseUrl());
        String url = proxyProperties.getSmartlabBaseUrl() + "/smartlab/control/upload";
        try {
            restTemplate.postForEntity(url, payload, String.class);
            log.info("设备回放数据请求已发送: {}", payload);
        } catch (Exception ex) {
            log.warn("设备回放数据请求失败: {}", ex.getMessage());
        }
    }
}
