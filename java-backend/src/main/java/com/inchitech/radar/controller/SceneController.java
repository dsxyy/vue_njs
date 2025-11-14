package com.inchitech.radar.controller;

import com.inchitech.radar.dto.ApiResponse;
import com.inchitech.radar.dto.PagedResponse;
import com.inchitech.radar.dto.SceneRequest;
import com.inchitech.radar.service.SceneService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/scenes")
public class SceneController {

    private final SceneService sceneService;

    public SceneController(SceneService sceneService) {
        this.sceneService = sceneService;
    }

    @GetMapping
    public PagedResponse<Map<String, Object>> listScenes(@RequestParam(required = false) String name,
                                                         @RequestParam(name = "emergency_contact", required = false) String emergencyContact,
                                                         @RequestParam(defaultValue = "1") int page,
                                                         @RequestParam(defaultValue = "10") int limit) {
        return sceneService.listScenes(name, emergencyContact, page, limit);
    }

    @GetMapping("/all")
    public ApiResponse<List<Map<String, Object>>> listAll() {
        return sceneService.listAllScenes();
    }

    @GetMapping("/{id:\\d+}")
    public ApiResponse<Map<String, Object>> getScene(@PathVariable Long id) {
        return sceneService.getScene(id);
    }

    @GetMapping("/{id:\\d+}/devices")
    public ApiResponse<List<Map<String, Object>>> getSceneDevices(@PathVariable Long id) {
        return sceneService.getSceneDevices(id);
    }

    @PostMapping
    public ApiResponse<Map<String, Object>> createScene(@Valid @RequestBody SceneRequest request) {
        return sceneService.createScene(request);
    }

    @PutMapping("/{id:\\d+}")
    public ApiResponse<Void> updateScene(@PathVariable Long id, @Valid @RequestBody SceneRequest request) {
        return sceneService.updateScene(id, request);
    }

    @DeleteMapping("/{id:\\d+}")
    public ApiResponse<Void> deleteScene(@PathVariable Long id) {
        return sceneService.deleteScene(id);
    }
}
