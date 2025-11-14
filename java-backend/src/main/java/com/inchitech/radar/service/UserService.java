package com.inchitech.radar.service;

import com.inchitech.radar.dto.ApiResponse;
import com.inchitech.radar.dto.PagedResponse;
import com.inchitech.radar.dto.UserRequest;
import com.inchitech.radar.model.UserInfo;
import com.inchitech.radar.repository.UserRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;

    public UserService(UserRepository userRepository, JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    public PagedResponse<UserInfo> listUsers(String name, String phone, Integer privileges, int page, int limit) {
        int pageSize = Math.max(limit, 1);
        int currentPage = Math.max(page, 1);
        int offset = (currentPage - 1) * pageSize;
        List<UserInfo> rows = userRepository.searchUsers(name, phone, privileges, pageSize, offset);
        long total = userRepository.countUsers(name, phone, privileges);
        return new PagedResponse<>(200, "获取用户列表成功", rows, total);
    }

    public ApiResponse<List<UserInfo>> listAllUsers() {
        return ApiResponse.success("获取用户列表成功", userRepository.findAllActive());
    }

    @Transactional
    public ApiResponse<Map<String, Object>> createUser(UserRequest request) {
        UserInfo user = mapToEntity(request);
        long id = userRepository.create(user);
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", id);
        return ApiResponse.success("用户创建成功", payload);
    }

    @Transactional
    public ApiResponse<Void> updateUser(Long id, UserRequest request) {
        UserInfo user = mapToEntity(request);
        int updated = userRepository.update(id, user);
        if (updated == 0) {
            return ApiResponse.failure(404, "用户不存在");
        }
        return ApiResponse.success("用户更新成功", null);
    }

    @Transactional
    public ApiResponse<Void> deleteUser(Long id) {
        int affected = userRepository.softDelete(id);
        if (affected == 0) {
            return ApiResponse.failure(404, "用户不存在或已删除");
        }
        jdbcTemplate.update("UPDATE scene_user_info SET del_flag = 1 WHERE userid = ?", id);
        jdbcTemplate.update("UPDATE user_family_info SET del_flag = 1 WHERE user_id = ?", id);
        return ApiResponse.success("用户删除成功", null);
    }

    public ApiResponse<List<Map<String, Object>>> getUserFamilies(Long userId) {
        List<Map<String, Object>> families = userRepository.findUserFamilies(userId);
        for (Map<String, Object> family : families) {
            Long familyId = ((Number) family.get("id")).longValue();
            family.put("owner", userRepository.findFamilyOwner(familyId).stream().findFirst().orElse(null));
            family.put("sharedUsers", userRepository.findFamilySharedUsers(familyId));
            family.put("scenes", userRepository.findFamilyScenes(familyId));
            int role = ((Number) family.get("userRole")).intValue();
            family.put("userRoleText", role == 0 ? "创建者" : "成员");
        }
        return ApiResponse.success("获取用户家庭列表成功", families);
    }

    private UserInfo mapToEntity(UserRequest request) {
        UserInfo user = new UserInfo();
        user.setName(request.getName());
        user.setPhone(request.getPhone());
        user.setCountryCode(request.getCountryCode() == null ? "86" : request.getCountryCode());
        user.setAssociationDevice(request.getAssociationDevice());
        user.setShareAccount(request.getShareAccount());
        user.setParentId(request.getParentId());
        user.setPrivileges(request.getPrivileges());
        user.setRemark(request.getRemark());
        user.setShowable(1);
        return user;
    }
}
