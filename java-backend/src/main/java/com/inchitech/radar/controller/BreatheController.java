package com.inchitech.radar.controller;

import com.inchitech.radar.dto.ApiResponse;
import com.inchitech.radar.dto.BreathDeviceRequest;
import com.inchitech.radar.dto.PagedResponse;
import com.inchitech.radar.model.BreathHeartDevice;
import com.inchitech.radar.service.BreatheDeviceService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/breathe")
public class BreatheController {

    private final BreatheDeviceService breatheDeviceService;

    public BreatheController(BreatheDeviceService breatheDeviceService) {
        this.breatheDeviceService = breatheDeviceService;
    }

    @GetMapping
    public PagedResponse<BreathHeartDevice> listDevices(@RequestParam(name = "device_id", required = false) String deviceId,
                                                        @RequestParam(required = false) String name,
                                                        @RequestParam(defaultValue = "1") int page,
                                                        @RequestParam(defaultValue = "10") int pageSize) {
        return breatheDeviceService.listDevices(deviceId, name, page, pageSize);
    }

    @PostMapping
    public ApiResponse<Map<String, Object>> createDevice(@Valid @RequestBody BreathDeviceRequest request) {
        return breatheDeviceService.createDevice(request);
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> updateDevice(@PathVariable Long id, @Valid @RequestBody BreathDeviceRequest request) {
        return breatheDeviceService.updateDevice(id, request);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteDevice(@PathVariable Long id) {
        return breatheDeviceService.deleteDevice(id);
    }

    @GetMapping("/{id}")
    public ApiResponse<BreathHeartDevice> getDevice(@PathVariable Long id) {
        return breatheDeviceService.getDevice(id);
    }
}
