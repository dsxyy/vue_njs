package com.inchitech.radar.service;

import com.inchitech.radar.dto.LoginRequest;
import com.inchitech.radar.dto.LoginResponse;
import com.inchitech.radar.model.SysUser;
import com.inchitech.radar.repository.SysUserRepository;
import com.inchitech.radar.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class AuthService {

    private final SysUserRepository sysUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(SysUserRepository sysUserRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.sysUserRepository = sysUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public LoginResponse login(LoginRequest request) {
        SysUser user = sysUserRepository.findByName(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("用户名或密码错误"));
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("用户名或密码错误");
        }
        String token = jwtService.generateToken(Map.of(
                "id", user.getId(),
                "username", user.getName()
        ));
        return new LoginResponse(200, "登录成功", token);
    }
}
