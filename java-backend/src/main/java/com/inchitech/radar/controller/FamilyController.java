package com.inchitech.radar.controller;

import com.inchitech.radar.dto.ApiResponse;
import com.inchitech.radar.dto.FamilyRequest;
import com.inchitech.radar.dto.PagedResponse;
import com.inchitech.radar.model.FamilyInfo;
import com.inchitech.radar.service.FamilyService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/families")
public class FamilyController {

    private final FamilyService familyService;

    public FamilyController(FamilyService familyService) {
        this.familyService = familyService;
    }

    @GetMapping
    public PagedResponse<FamilyInfo> listFamilies(@RequestParam(required = false) String name,
                                                  @RequestParam(defaultValue = "1") int page,
                                                  @RequestParam(defaultValue = "10") int limit) {
        return familyService.listFamilies(name, page, limit);
    }

    @GetMapping("/all")
    public ApiResponse<List<Map<String, Object>>> listAllFamilies() {
        return familyService.listAllFamilies();
    }

    @GetMapping("/{id:\\d+}")
    public ApiResponse<Map<String, Object>> getFamily(@PathVariable Long id) {
        return familyService.getFamily(id);
    }

    @PostMapping
    public ApiResponse<Map<String, Object>> createFamily(@Valid @RequestBody FamilyRequest request) {
        return familyService.createFamily(request);
    }

    @PutMapping("/{id:\\d+}")
    public ApiResponse<Void> updateFamily(@PathVariable Long id, @Valid @RequestBody FamilyRequest request) {
        return familyService.updateFamily(id, request);
    }

    @DeleteMapping("/{id:\\d+}")
    public ApiResponse<Void> deleteFamily(@PathVariable Long id) {
        return familyService.deleteFamily(id);
    }
}
