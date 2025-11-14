package com.inchitech.radar.controller;

import com.inchitech.radar.dto.ApiResponse;
import com.inchitech.radar.dto.DeviceUpdateRequest;
import com.inchitech.radar.dto.PagedResponse;
import com.inchitech.radar.service.DeviceService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/devices")
public class DeviceController {

    private final DeviceService deviceService;

    public DeviceController(DeviceService deviceService) {
        this.deviceService = deviceService;
    }

    @GetMapping
    public PagedResponse<Map<String, Object>> listDevices(@RequestParam(required = false) String mac,
                                                          @RequestParam(required = false) String name,
                                                          @RequestParam(defaultValue = "1") int page,
                                                          @RequestParam(defaultValue = "10") int pageSize) {
        return deviceService.listDevices(mac, name, page, pageSize);
    }

    @GetMapping("/warns")
    public ApiResponse<List<Map<String, Object>>> getWarns(@RequestParam("deviceId") String deviceId,
                                                           @RequestParam("date") @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate date) {
        return deviceService.getDeviceWarns(deviceId, date);
    }

    @GetMapping("/{id}")
    public ApiResponse<Map<String, Object>> getDevice(@PathVariable Long id) {
        return deviceService.getDevice(id);
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> updateDevice(@PathVariable Long id, @Valid @RequestBody DeviceUpdateRequest request) {
        return deviceService.updateDevice(id, request);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteDevice(@PathVariable Long id) {
        return deviceService.deleteDevice(id);
    }
}
