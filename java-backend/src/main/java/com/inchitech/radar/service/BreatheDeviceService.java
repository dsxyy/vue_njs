package com.inchitech.radar.service;

import com.inchitech.radar.dto.ApiResponse;
import com.inchitech.radar.dto.BreathDeviceRequest;
import com.inchitech.radar.dto.PagedResponse;
import com.inchitech.radar.model.BreathHeartDevice;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class BreatheDeviceService {

    private final JdbcTemplate jdbcTemplate;
    private final NamedParameterJdbcTemplate namedJdbcTemplate;
    private final BeanPropertyRowMapper<BreathHeartDevice> rowMapper = BeanPropertyRowMapper.newInstance(BreathHeartDevice.class);

    public BreatheDeviceService(JdbcTemplate jdbcTemplate, NamedParameterJdbcTemplate namedJdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        this.namedJdbcTemplate = namedJdbcTemplate;
    }

    public PagedResponse<BreathHeartDevice> listDevices(String deviceId, String name, int page, int pageSize) {
        int size = Math.max(pageSize, 1);
        int currentPage = Math.max(page, 1);
        int offset = (currentPage - 1) * size;
        MapSqlParameterSource params = new MapSqlParameterSource();
        StringBuilder where = new StringBuilder("WHERE d.del_flag = 0");
        if (deviceId != null && !deviceId.isBlank()) {
            where.append(" AND d.device_id LIKE :deviceId");
            params.addValue("deviceId", "%" + deviceId + "%");
        }
        if (name != null && !name.isBlank()) {
            where.append(" AND d.name LIKE :name");
            params.addValue("name", "%" + name + "%");
        }
        String dataSql = "SELECT * FROM breath_heart_device_info d " + where +
                " ORDER BY d.id DESC LIMIT :limit OFFSET :offset";
        String countSql = "SELECT COUNT(*) FROM breath_heart_device_info d " + where;
        params.addValue("limit", size);
        params.addValue("offset", offset);
        List<BreathHeartDevice> rows = namedJdbcTemplate.query(dataSql, params, rowMapper);
        long total = namedJdbcTemplate.queryForObject(countSql, params, Long.class);
        return new PagedResponse<>(200, "获取呼吸心跳设备列表成功", rows, total);
    }

    @Transactional
    public ApiResponse<Map<String, Object>> createDevice(BreathDeviceRequest request) {
        try {
            jdbcTemplate.update(
                    "INSERT INTO breath_heart_device_info (name, device_id, width, heigth, status, text1, text2, text3, text4, text5, text6, text7, text8, del_flag) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)",
                    request.getName(),
                    request.getDeviceId(),
                    request.getWidth(),
                    request.getHeigth(),
                    request.getStatus(),
                    request.getText1(),
                    request.getText2(),
                    request.getText3(),
                    request.getText4(),
                    request.getText5(),
                    request.getText6(),
                    request.getText7(),
                    request.getText8()
            );
        } catch (Exception ex) {
            if (ex.getMessage() != null && ex.getMessage().contains("Duplicate")) {
                return ApiResponse.failure(409, "device_id 已存在");
            }
            throw ex;
        }
        Long id = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return ApiResponse.success("呼吸心跳设备创建成功", Map.of("id", id));
    }

    @Transactional
    public ApiResponse<Void> updateDevice(Long id, BreathDeviceRequest request) {
        int affected = jdbcTemplate.update(
                "UPDATE breath_heart_device_info SET name = ?, width = ?, heigth = ?, status = ?, text1 = ?, text2 = ?, text3 = ?, text4 = ?, text5 = ?, text6 = ?, text7 = ?, text8 = ? " +
                        "WHERE id = ? AND del_flag = 0",
                request.getName(),
                request.getWidth(),
                request.getHeigth(),
                request.getStatus(),
                request.getText1(),
                request.getText2(),
                request.getText3(),
                request.getText4(),
                request.getText5(),
                request.getText6(),
                request.getText7(),
                request.getText8(),
                id
        );
        if (affected == 0) {
            return ApiResponse.failure(404, "设备不存在或已被删除");
        }
        return ApiResponse.success("设备更新成功", null);
    }

    @Transactional
    public ApiResponse<Void> deleteDevice(Long id) {
        int affected = jdbcTemplate.update(
                "UPDATE breath_heart_device_info SET del_flag = 1 WHERE id = ? AND del_flag = 0",
                id
        );
        if (affected == 0) {
            return ApiResponse.failure(404, "设备不存在或已被删除");
        }
        return ApiResponse.success("设备删除成功", null);
    }

    public ApiResponse<BreathHeartDevice> getDevice(Long id) {
        BreathHeartDevice device = jdbcTemplate.query(
                "SELECT * FROM breath_heart_device_info WHERE id = ? AND del_flag = 0",
                rowMapper,
                id
        ).stream().findFirst().orElseThrow(() -> new IllegalArgumentException("设备不存在"));
        return ApiResponse.success("获取设备详情成功", device);
    }
}
