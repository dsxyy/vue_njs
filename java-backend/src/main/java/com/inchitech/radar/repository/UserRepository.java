package com.inchitech.radar.repository;

import com.inchitech.radar.model.UserInfo;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class UserRepository {

    private final JdbcTemplate jdbcTemplate;
    private final NamedParameterJdbcTemplate namedJdbcTemplate;
    private final BeanPropertyRowMapper<UserInfo> rowMapper = BeanPropertyRowMapper.newInstance(UserInfo.class);

    public UserRepository(JdbcTemplate jdbcTemplate, NamedParameterJdbcTemplate namedJdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        this.namedJdbcTemplate = namedJdbcTemplate;
    }

    public List<UserInfo> searchUsers(String name, String phone, Integer privileges, int limit, int offset) {
        StringBuilder sql = new StringBuilder("SELECT * FROM user_info WHERE showable = 1");
        MapSqlParameterSource params = new MapSqlParameterSource();
        if (name != null && !name.isBlank()) {
            sql.append(" AND name LIKE :name");
            params.addValue("name", "%" + name + "%");
        }
        if (phone != null && !phone.isBlank()) {
            sql.append(" AND phone LIKE :phone");
            params.addValue("phone", "%" + phone + "%");
        }
        if (privileges != null) {
            sql.append(" AND privileges = :privileges");
            params.addValue("privileges", privileges);
        }
        sql.append(" ORDER BY id DESC LIMIT :limit OFFSET :offset");
        params.addValue("limit", limit);
        params.addValue("offset", offset);
        return namedJdbcTemplate.query(sql.toString(), params, rowMapper);
    }

    public long countUsers(String name, String phone, Integer privileges) {
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM user_info WHERE showable = 1");
        MapSqlParameterSource params = new MapSqlParameterSource();
        if (name != null && !name.isBlank()) {
            sql.append(" AND name LIKE :name");
            params.addValue("name", "%" + name + "%");
        }
        if (phone != null && !phone.isBlank()) {
            sql.append(" AND phone LIKE :phone");
            params.addValue("phone", "%" + phone + "%");
        }
        if (privileges != null) {
            sql.append(" AND privileges = :privileges");
            params.addValue("privileges", privileges);
        }
        return namedJdbcTemplate.queryForObject(sql.toString(), params, Long.class);
    }

    public List<UserInfo> findAllActive() {
        return jdbcTemplate.query("SELECT id, name, phone, privileges FROM user_info WHERE showable = 1 ORDER BY id DESC", rowMapper);
    }

    public long create(UserInfo user) {
        jdbcTemplate.update(
                "INSERT INTO user_info (name, phone, countryCode, association_device, shareAccount, parentId, privileges, remark, showable) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)",
                user.getName(),
                user.getPhone(),
                user.getCountryCode(),
                user.getAssociationDevice(),
                user.getShareAccount(),
                user.getParentId(),
                user.getPrivileges(),
                user.getRemark()
        );
        return jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
    }

    public int update(Long id, UserInfo user) {
        return jdbcTemplate.update(
                "UPDATE user_info SET name = ?, phone = ?, countryCode = ?, association_device = ?, shareAccount = ?, parentId = ?, privileges = ?, remark = ? WHERE id = ?",
                user.getName(),
                user.getPhone(),
                user.getCountryCode(),
                user.getAssociationDevice(),
                user.getShareAccount(),
                user.getParentId(),
                user.getPrivileges(),
                user.getRemark(),
                id
        );
    }

    public int softDelete(Long id) {
        return jdbcTemplate.update("UPDATE user_info SET showable = 2 WHERE id = ? AND showable = 1", id);
    }

    public Optional<UserInfo> findById(Long id) {
        return jdbcTemplate.query("SELECT * FROM user_info WHERE id = ?", rowMapper, id)
                .stream()
                .findFirst();
    }

    public List<Map<String, Object>> findUserFamilies(Long userId) {
        return jdbcTemplate.queryForList(
                "SELECT f.id, f.name, uf.privileges as userRole FROM family_info f " +
                        "JOIN user_family_info uf ON f.id = uf.family_id " +
                        "WHERE uf.user_id = ? AND f.del_flag = 0 AND uf.del_flag = 0 ORDER BY f.id DESC",
                userId
        );
    }

    public List<Map<String, Object>> findFamilyOwner(Long familyId) {
        return jdbcTemplate.queryForList(
                "SELECT u.id, u.name FROM user_family_info uf JOIN user_info u ON uf.user_id = u.id " +
                        "WHERE uf.family_id = ? AND uf.privileges = 0 AND uf.del_flag = 0",
                familyId
        );
    }

    public List<Map<String, Object>> findFamilySharedUsers(Long familyId) {
        return jdbcTemplate.queryForList(
                "SELECT u.id, u.name FROM user_family_info uf JOIN user_info u ON uf.user_id = u.id " +
                        "WHERE uf.family_id = ? AND uf.privileges = 1 AND uf.del_flag = 0",
                familyId
        );
    }

    public List<Map<String, Object>> findFamilyScenes(Long familyId) {
        return jdbcTemplate.queryForList(
                "SELECT id, name FROM scene_info WHERE family_id = ? AND del_flag = 0",
                familyId
        );
    }
}
