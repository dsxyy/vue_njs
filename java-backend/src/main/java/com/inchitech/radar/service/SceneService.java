package com.inchitech.radar.service;

import com.inchitech.radar.dto.ApiResponse;
import com.inchitech.radar.dto.PagedResponse;
import com.inchitech.radar.dto.SceneRequest;
import com.inchitech.radar.integration.SmartLabClient;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class SceneService {

    private final JdbcTemplate jdbcTemplate;
    private final NamedParameterJdbcTemplate namedJdbcTemplate;
    private final SmartLabClient smartLabClient;

    public SceneService(JdbcTemplate jdbcTemplate,
                        NamedParameterJdbcTemplate namedJdbcTemplate,
                        SmartLabClient smartLabClient) {
        this.jdbcTemplate = jdbcTemplate;
        this.namedJdbcTemplate = namedJdbcTemplate;
        this.smartLabClient = smartLabClient;
    }

    public PagedResponse<Map<String, Object>> listScenes(String name, String emergencyContact, int page, int limit) {
        int pageSize = Math.max(limit, 1);
        int currentPage = Math.max(page, 1);
        int offset = (currentPage - 1) * pageSize;
        MapSqlParameterSource params = new MapSqlParameterSource();
        String baseWhere = "WHERE s.del_flag = 0";
        StringBuilder where = new StringBuilder(baseWhere);
        if (name != null && !name.isBlank()) {
            where.append(" AND s.name LIKE :name");
            params.addValue("name", "%" + name + "%");
        }
        if (emergencyContact != null && !emergencyContact.isBlank()) {
            where.append(" AND s.emergencyContact LIKE :contact");
            params.addValue("contact", "%" + emergencyContact + "%");
        }
        String dataSql = "SELECT s.*, f.name AS family_name FROM scene_info s " +
                "LEFT JOIN family_info f ON s.family_id = f.id AND f.del_flag = 0 " +
                where + " ORDER BY s.id DESC LIMIT :limit OFFSET :offset";
        params.addValue("limit", pageSize);
        params.addValue("offset", offset);
        String countSql = "SELECT COUNT(*) FROM scene_info s " + where;
        List<Map<String, Object>> rows = namedJdbcTemplate.queryForList(dataSql, params);
        long total = namedJdbcTemplate.queryForObject(countSql, params, Long.class);
        return new PagedResponse<>(200, "获取场景列表成功", rows, total);
    }

    public ApiResponse<Map<String, Object>> getScene(Long id) {
        Map<String, Object> scene = jdbcTemplate.queryForMap(
                "SELECT * FROM scene_info WHERE id = ? AND del_flag = 0",
                id
        );
        return ApiResponse.success("获取场景详情成功", scene);
    }

    public ApiResponse<List<Map<String, Object>>> getSceneDevices(Long sceneId) {
        List<Map<String, Object>> devices = jdbcTemplate.queryForList(
                "SELECT * FROM device_info WHERE sceneId = ? AND showAble = 1 ORDER BY id DESC",
                sceneId
        );
        return ApiResponse.success("获取场景设备列表成功", devices);
    }

    public ApiResponse<List<Map<String, Object>>> listAllScenes() {
        List<Map<String, Object>> scenes = jdbcTemplate.queryForList(
                "SELECT id, name FROM scene_info WHERE del_flag = 0 ORDER BY id DESC"
        );
        return ApiResponse.success("获取场景列表成功", scenes);
    }

    @Transactional
    public ApiResponse<Map<String, Object>> createScene(SceneRequest request) {
        jdbcTemplate.update(
                "INSERT INTO scene_info (name, room_x_length, room_y_length, emergencyContact, family_id, del_flag) " +
                        "VALUES (?, ?, ?, ?, ?, 0)",
                request.getName(),
                request.getRoomXLength(),
                request.getRoomYLength(),
                request.getEmergencyContact(),
                request.getFamilyId()
        );
        Long sceneId = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        if (request.getFamilyId() != null) {
            syncSceneUsersWithFamily(sceneId, request.getFamilyId());
        }
        return ApiResponse.success("场景创建成功", Map.of("id", sceneId));
    }

    @Transactional
    public ApiResponse<Void> updateScene(Long id, SceneRequest request) {
        Long oldFamilyId = jdbcTemplate.queryForObject(
                "SELECT family_id FROM scene_info WHERE id = ?",
                Long.class,
                id
        );
        jdbcTemplate.update(
                "UPDATE scene_info SET name = ?, room_x_length = ?, room_y_length = ?, emergencyContact = ?, family_id = ? WHERE id = ?",
                request.getName(),
                request.getRoomXLength(),
                request.getRoomYLength(),
                request.getEmergencyContact(),
                request.getFamilyId(),
                id
        );
        jdbcTemplate.update(
                "UPDATE device_info SET deltaX_room = ?, deltaY_room = ? WHERE sceneId = ?",
                request.getRoomXLength(),
                request.getRoomYLength(),
                id
        );
        if ((oldFamilyId == null && request.getFamilyId() != null) ||
                (oldFamilyId != null && !oldFamilyId.equals(request.getFamilyId()))) {
            jdbcTemplate.update("UPDATE scene_user_info SET del_flag = 1 WHERE scene_id = ?", id);
            if (request.getFamilyId() != null) {
                syncSceneUsersWithFamily(id, request.getFamilyId());
            }
        }
        syncDevicesWithSmartLab(id);
        return ApiResponse.success("场景更新成功", null);
    }

    @Transactional
    public ApiResponse<Void> deleteScene(Long id) {
        jdbcTemplate.update("UPDATE scene_info SET del_flag = 1 WHERE id = ?", id);
        jdbcTemplate.update("UPDATE scene_user_info SET del_flag = 1 WHERE scene_id = ?", id);
        return ApiResponse.success("场景删除成功", null);
    }

    private void syncSceneUsersWithFamily(Long sceneId, Long familyId) {
        List<Long> userIds = jdbcTemplate.queryForList(
                "SELECT user_id FROM user_family_info WHERE family_id = ? AND del_flag = 0",
                Long.class,
                familyId
        );
        for (Long userId : userIds) {
            jdbcTemplate.update(
                    "INSERT INTO scene_user_info (scene_id, userid, del_flag) VALUES (?, ?, 0) " +
                            "ON DUPLICATE KEY UPDATE del_flag = 0",
                    sceneId, userId
            );
        }
    }

    private void syncDevicesWithSmartLab(Long sceneId) {
        List<Map<String, Object>> devices = jdbcTemplate.queryForList(
                "SELECT * FROM device_info WHERE sceneId = ? AND showAble = 1",
                sceneId
        );
        devices.forEach(smartLabClient::uploadDeviceInfo);
    }
}
