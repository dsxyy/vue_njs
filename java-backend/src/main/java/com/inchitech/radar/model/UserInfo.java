package com.inchitech.radar.model;

public class UserInfo {
    private Long id;
    private String name;
    private String phone;
    private String countryCode;
    private String associationDevice;
    private Integer shareAccount;
    private Long parentId;
    private Integer privileges;
    private String remark;
    private Integer showable;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
    }

    public String getAssociationDevice() {
        return associationDevice;
    }

    public void setAssociationDevice(String associationDevice) {
        this.associationDevice = associationDevice;
    }

    public Integer getShareAccount() {
        return shareAccount;
    }

    public void setShareAccount(Integer shareAccount) {
        this.shareAccount = shareAccount;
    }

    public Long getParentId() {
        return parentId;
    }

    public void setParentId(Long parentId) {
        this.parentId = parentId;
    }

    public Integer getPrivileges() {
        return privileges;
    }

    public void setPrivileges(Integer privileges) {
        this.privileges = privileges;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }

    public Integer getShowable() {
        return showable;
    }

    public void setShowable(Integer showable) {
        this.showable = showable;
    }
}
