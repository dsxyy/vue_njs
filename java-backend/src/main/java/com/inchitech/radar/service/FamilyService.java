package com.inchitech.radar.service;

import com.inchitech.radar.dto.ApiResponse;
import com.inchitech.radar.dto.FamilyRequest;
import com.inchitech.radar.dto.PagedResponse;
import com.inchitech.radar.model.FamilyInfo;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class FamilyService {

    private final JdbcTemplate jdbcTemplate;
    private final NamedParameterJdbcTemplate namedJdbcTemplate;
    private final BeanPropertyRowMapper<FamilyInfo> rowMapper = BeanPropertyRowMapper.newInstance(FamilyInfo.class);

    public FamilyService(JdbcTemplate jdbcTemplate, NamedParameterJdbcTemplate namedJdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        this.namedJdbcTemplate = namedJdbcTemplate;
    }

    public PagedResponse<FamilyInfo> listFamilies(String name, int page, int limit) {
        int pageSize = Math.max(limit, 1);
        int currentPage = Math.max(page, 1);
        int offset = (currentPage - 1) * pageSize;
        MapSqlParameterSource params = new MapSqlParameterSource();
        StringBuilder dataSql = new StringBuilder("SELECT * FROM family_info WHERE del_flag = 0");
        StringBuilder countSql = new StringBuilder("SELECT COUNT(*) FROM family_info WHERE del_flag = 0");
        if (name != null && !name.isBlank()) {
            dataSql.append(" AND name LIKE :name");
            countSql.append(" AND name LIKE :name");
            params.addValue("name", "%" + name + "%");
        }
        dataSql.append(" ORDER BY id DESC LIMIT :limit OFFSET :offset");
        params.addValue("limit", pageSize);
        params.addValue("offset", offset);
        List<FamilyInfo> rows = namedJdbcTemplate.query(dataSql.toString(), params, rowMapper);
        long total = namedJdbcTemplate.queryForObject(countSql.toString(), params, Long.class);
        rows.forEach(this::hydrateFamilyRelations);
        return new PagedResponse<>(200, "获取家庭列表成功", rows, total);
    }

    public ApiResponse<Map<String, Object>> getFamily(Long id) {
        FamilyInfo family = jdbcTemplate.query("SELECT * FROM family_info WHERE id = ? AND del_flag = 0", rowMapper, id)
                .stream()
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("家庭不存在"));
        hydrateFamilyRelations(family);
        Map<String, Object> payload = new HashMap<>();
        payload.put("family", family);
        payload.put("owner", findOwner(family.getId()));
        payload.put("sharedUsers", findSharedUsers(family.getId()));
        payload.put("scenes", findScenes(family.getId()));
        return ApiResponse.success("获取家庭详情成功", payload);
    }

    public ApiResponse<List<Map<String, Object>>> listAllFamilies() {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT id, name FROM family_info WHERE del_flag = 0 ORDER BY id DESC"
        );
        return ApiResponse.success("获取家庭列表成功", rows);
    }

    @Transactional
    public ApiResponse<Map<String, Object>> createFamily(FamilyRequest request) {
        jdbcTemplate.update("INSERT INTO family_info (name, del_flag) VALUES (?, 0)", request.getName());
        Long familyId = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        if (request.getOwnerId() != null) {
            upsertUserFamily(request.getOwnerId(), familyId, 0);
        }
        Map<String, Object> payload = Map.of("id", familyId);
        return ApiResponse.success("家庭创建成功", payload);
    }

    @Transactional
    public ApiResponse<Void> updateFamily(Long id, FamilyRequest request) {
        jdbcTemplate.update("UPDATE family_info SET name = ? WHERE id = ?", request.getName(), id);
        if (request.getOwnerId() != null) {
            jdbcTemplate.update("UPDATE user_family_info SET del_flag = 1 WHERE family_id = ? AND privileges = 0", id);
            upsertUserFamily(request.getOwnerId(), id, 0);
            syncSceneUsersWithOwner(id, request.getOwnerId());
        }
        return ApiResponse.success("家庭信息更新成功", null);
    }

    @Transactional
    public ApiResponse<Void> deleteFamily(Long id) {
        jdbcTemplate.update("UPDATE family_info SET del_flag = 1 WHERE id = ?", id);
        jdbcTemplate.update("UPDATE user_family_info SET del_flag = 1 WHERE family_id = ?", id);
        jdbcTemplate.update("UPDATE scene_user_info SET del_flag = 1 WHERE scene_id IN (SELECT id FROM scene_info WHERE family_id = ?)", id);
        return ApiResponse.success("删除成功", null);
    }

    private void hydrateFamilyRelations(FamilyInfo family) {
        family.setDelFlag(null); // 不暴露软删除标记
    }

    private Map<String, Object> findOwner(Long familyId) {
        return jdbcTemplate.queryForList(
                "SELECT u.id, u.name FROM user_family_info uf JOIN user_info u ON uf.user_id = u.id " +
                        "WHERE uf.family_id = ? AND uf.privileges = 0 AND uf.del_flag = 0",
                familyId
        ).stream().findFirst().orElse(null);
    }

    private List<Map<String, Object>> findSharedUsers(Long familyId) {
        return jdbcTemplate.queryForList(
                "SELECT u.id, u.name FROM user_family_info uf JOIN user_info u ON uf.user_id = u.id " +
                        "WHERE uf.family_id = ? AND uf.privileges = 1 AND uf.del_flag = 0",
                familyId
        );
    }

    private List<Map<String, Object>> findScenes(Long familyId) {
        return jdbcTemplate.queryForList("SELECT id, name FROM scene_info WHERE family_id = ? AND del_flag = 0", familyId);
    }

    private void upsertUserFamily(Long userId, Long familyId, int privileges) {
        jdbcTemplate.update(
                "INSERT INTO user_family_info (user_id, family_id, privileges, del_flag) VALUES (?, ?, ?, 0) " +
                        "ON DUPLICATE KEY UPDATE del_flag = 0, privileges = VALUES(privileges)",
                userId, familyId, privileges
        );
    }

    private void syncSceneUsersWithOwner(Long familyId, Long ownerId) {
        List<Long> sceneIds = jdbcTemplate.queryForList(
                "SELECT id FROM scene_info WHERE family_id = ? AND del_flag = 0",
                Long.class,
                familyId
        );
        for (Long sceneId : sceneIds) {
            jdbcTemplate.update("UPDATE scene_user_info SET del_flag = 1 WHERE scene_id = ?", sceneId);
            jdbcTemplate.update(
                    "INSERT INTO scene_user_info (scene_id, userid, del_flag) VALUES (?, ?, 0) " +
                            "ON DUPLICATE KEY UPDATE del_flag = 0",
                    sceneId, ownerId
            );
        }
    }
}
