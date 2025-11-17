package com.inchitech.radar.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.proxy")
public class ProxyProperties {

    private String smartlabBaseUrl;
    private String uploadBaseUrl;
    private String radarDataRoot = "./radarData/radar_data";

    public String getSmartlabBaseUrl() {
        return smartlabBaseUrl;
    }

    public void setSmartlabBaseUrl(String smartlabBaseUrl) {
        this.smartlabBaseUrl = smartlabBaseUrl;
    }

    public String getUploadBaseUrl() {
        return uploadBaseUrl;
    }

    public void setUploadBaseUrl(String uploadBaseUrl) {
        this.uploadBaseUrl = uploadBaseUrl;
    }

    public String getRadarDataRoot() {
        return radarDataRoot;
    }

    public void setRadarDataRoot(String radarDataRoot) {
        this.radarDataRoot = radarDataRoot;
    }
}
