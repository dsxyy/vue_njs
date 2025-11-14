package com.inchitech.radar.model;

public class DeviceInfo {
    private Long id;
    private String mac;
    private String name;
    private Double radarHeight;
    private Double downAngle;
    private Long sceneId;
    private Double xLocation;
    private Double yLocation;
    private Double deltaXRoom;
    private Double deltaYRoom;
    private Integer isSendMessage;
    private Integer waveTrigger;
    private Integer fallTrigger;
    private Integer longLayDetect;
    private Integer selfCalib;
    private String language;
    private Integer status;
    private Integer showAble;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getMac() {
        return mac;
    }

    public void setMac(String mac) {
        this.mac = mac;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Double getRadarHeight() {
        return radarHeight;
    }

    public void setRadarHeight(Double radarHeight) {
        this.radarHeight = radarHeight;
    }

    public Double getDownAngle() {
        return downAngle;
    }

    public void setDownAngle(Double downAngle) {
        this.downAngle = downAngle;
    }

    public Long getSceneId() {
        return sceneId;
    }

    public void setSceneId(Long sceneId) {
        this.sceneId = sceneId;
    }

    public Double getXLocation() {
        return xLocation;
    }

    public void setXLocation(Double xLocation) {
        this.xLocation = xLocation;
    }

    public Double getYLocation() {
        return yLocation;
    }

    public void setYLocation(Double yLocation) {
        this.yLocation = yLocation;
    }

    public Double getDeltaXRoom() {
        return deltaXRoom;
    }

    public void setDeltaXRoom(Double deltaXRoom) {
        this.deltaXRoom = deltaXRoom;
    }

    public Double getDeltaYRoom() {
        return deltaYRoom;
    }

    public void setDeltaYRoom(Double deltaYRoom) {
        this.deltaYRoom = deltaYRoom;
    }

    public Integer getIsSendMessage() {
        return isSendMessage;
    }

    public void setIsSendMessage(Integer isSendMessage) {
        this.isSendMessage = isSendMessage;
    }

    public Integer getWaveTrigger() {
        return waveTrigger;
    }

    public void setWaveTrigger(Integer waveTrigger) {
        this.waveTrigger = waveTrigger;
    }

    public Integer getFallTrigger() {
        return fallTrigger;
    }

    public void setFallTrigger(Integer fallTrigger) {
        this.fallTrigger = fallTrigger;
    }

    public Integer getLongLayDetect() {
        return longLayDetect;
    }

    public void setLongLayDetect(Integer longLayDetect) {
        this.longLayDetect = longLayDetect;
    }

    public Integer getSelfCalib() {
        return selfCalib;
    }

    public void setSelfCalib(Integer selfCalib) {
        this.selfCalib = selfCalib;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }

    public Integer getShowAble() {
        return showAble;
    }

    public void setShowAble(Integer showAble) {
        this.showAble = showAble;
    }
}
