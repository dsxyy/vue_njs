package com.inchitech.radar.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class SceneRequest {
    @NotBlank
    private String name;

    @NotNull
    private Double roomXLength;

    @NotNull
    private Double roomYLength;

    private String emergencyContact;
    private Long familyId;

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
}
