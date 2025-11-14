package com.inchitech.radar.model;

import java.time.LocalDateTime;

public class DeviceWarn {
    private Long id;
    private String deviceid;
    private LocalDateTime currenttime;
    private String warnType;
    private String payload;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDeviceid() {
        return deviceid;
    }

    public void setDeviceid(String deviceid) {
        this.deviceid = deviceid;
    }

    public LocalDateTime getCurrenttime() {
        return currenttime;
    }

    public void setCurrenttime(LocalDateTime currenttime) {
        this.currenttime = currenttime;
    }

    public String getWarnType() {
        return warnType;
    }

    public void setWarnType(String warnType) {
        this.warnType = warnType;
    }

    public String getPayload() {
        return payload;
    }

    public void setPayload(String payload) {
        this.payload = payload;
    }
}
