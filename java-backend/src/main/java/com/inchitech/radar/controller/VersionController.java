package com.inchitech.radar.controller;

import com.inchitech.radar.dto.ApiResponse;
import com.inchitech.radar.dto.PagedResponse;
import com.inchitech.radar.dto.VersionRequest;
import com.inchitech.radar.model.VersionInfo;
import com.inchitech.radar.service.VersionService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/versions")
public class VersionController {

    private final VersionService versionService;

    public VersionController(VersionService versionService) {
        this.versionService = versionService;
    }

    @GetMapping
    public PagedResponse<VersionInfo> listVersions(@RequestParam(required = false) String name,
                                                   @RequestParam(defaultValue = "1") int page,
                                                   @RequestParam(defaultValue = "10") int limit) {
        return versionService.listVersions(name, page, limit);
    }

    @GetMapping("/all")
    public ApiResponse<List<VersionInfo>> listAllVersions() {
        return versionService.listAllVersions();
    }

    @PostMapping
    public ApiResponse<Map<String, Object>> createVersion(@Valid @RequestBody VersionRequest request) {
        return versionService.createVersion(request);
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> updateVersion(@PathVariable Long id, @Valid @RequestBody VersionRequest request) {
        return versionService.updateVersion(id, request);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteVersion(@PathVariable Long id) {
        return versionService.deleteVersion(id);
    }

    @GetMapping("/{id:\\d+}")
    public ApiResponse<VersionInfo> getVersion(@PathVariable Long id) {
        return versionService.getVersion(id);
    }

    @PostMapping("/upload")
    public ApiResponse<Map<String, Object>> uploadVersionFile(@RequestParam("file") MultipartFile file) throws IOException {
        return versionService.uploadVersionFile(file);
    }
}
