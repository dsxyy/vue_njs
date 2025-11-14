package com.inchitech.radar.controller;

import com.inchitech.radar.dto.ApiResponse;
import com.inchitech.radar.dto.LoginRequest;
import com.inchitech.radar.dto.LoginResponse;
import com.inchitech.radar.dto.PagedResponse;
import com.inchitech.radar.dto.UserRequest;
import com.inchitech.radar.model.UserInfo;
import com.inchitech.radar.service.AuthService;
import com.inchitech.radar.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users")
public class UserController {

    private final AuthService authService;
    private final UserService userService;

    public UserController(AuthService authService, UserService userService) {
        this.authService = authService;
        this.userService = userService;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping
    public PagedResponse<UserInfo> listUsers(@RequestParam(required = false) String name,
                                             @RequestParam(required = false) String phone,
                                             @RequestParam(required = false) Integer privileges,
                                             @RequestParam(defaultValue = "1") int page,
                                             @RequestParam(defaultValue = "10") int limit) {
        return userService.listUsers(name, phone, privileges, page, limit);
    }

    @GetMapping("/all")
    public ApiResponse<List<UserInfo>> listAll() {
        return userService.listAllUsers();
    }

    @PostMapping
    public ApiResponse<Map<String, Object>> createUser(@Valid @RequestBody UserRequest request) {
        return userService.createUser(request);
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> updateUser(@PathVariable Long id, @Valid @RequestBody UserRequest request) {
        return userService.updateUser(id, request);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteUser(@PathVariable Long id) {
        return userService.deleteUser(id);
    }

    @GetMapping("/{id}/families")
    public ApiResponse<List<Map<String, Object>>> getUserFamilies(@PathVariable Long id) {
        return userService.getUserFamilies(id);
    }
}
