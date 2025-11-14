package com.inchitech.radar.model;

public class SceneInfo {
    private Long id;
    private String name;
    private Double roomXLength;
    private Double roomYLength;
    private String emergencyContact;
    private Long familyId;
    private Integer delFlag;

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

    public Double getRoomXLength() {
        return roomXLength;
    }

    public void setRoomXLength(Double roomXLength) {
        this.roomXLength = roomXLength;
    }

    public Double getRoomYLength() {
        return roomYLength;
    }

    public void setRoomYLength(Double roomYLength) {
        this.roomYLength = roomYLength;
    }

    public String getEmergencyContact() {
        return emergencyContact;
    }

    public void setEmergencyContact(String emergencyContact) {
        this.emergencyContact = emergencyContact;
    }

    public Long getFamilyId() {
        return familyId;
    }

    public void setFamilyId(Long familyId) {
        this.familyId = familyId;
    }

    public Integer getDelFlag() {
        return delFlag;
    }

    public void setDelFlag(Integer delFlag) {
        this.delFlag = delFlag;
    }
}
