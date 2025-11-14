package com.inchitech.radar.service;

import com.inchitech.radar.dto.ApiResponse;
import com.inchitech.radar.dto.DeviceUpdateRequest;
import com.inchitech.radar.dto.PagedResponse;
import com.inchitech.radar.integration.SmartLabClient;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class DeviceService {

    private final JdbcTemplate jdbcTemplate;
    private final NamedParameterJdbcTemplate namedJdbcTemplate;
    private final SmartLabClient smartLabClient;

    public DeviceService(JdbcTemplate jdbcTemplate,
                         NamedParameterJdbcTemplate namedJdbcTemplate,
                         SmartLabClient smartLabClient) {
        this.jdbcTemplate = jdbcTemplate;
        this.namedJdbcTemplate = namedJdbcTemplate;
        this.smartLabClient = smartLabClient;
    }

    public PagedResponse<Map<String, Object>> listDevices(String mac, String name, int page, int pageSize) {
        int size = Math.max(pageSize, 1);
        int currentPage = Math.max(page, 1);
        int offset = (currentPage - 1) * size;
        MapSqlParameterSource params = new MapSqlParameterSource();
        StringBuilder where = new StringBuilder("WHERE d.showAble = 1");
        if (mac != null && !mac.isBlank()) {
            where.append(" AND d.mac LIKE :mac");
            params.addValue("mac", "%" + mac + "%");
        }
        if (name != null && !name.isBlank()) {
            where.append(" AND d.name LIKE :name");
            params.addValue("name", "%" + name + "%");
        }
        String dataSql = "SELECT d.*, s.name AS scene_name FROM device_info d " +
                "LEFT JOIN scene_info s ON d.sceneId = s.id " + where +
                " ORDER BY d.status ASC, d.id DESC LIMIT :limit OFFSET :offset";
        params.addValue("limit", size);
        params.addValue("offset", offset);
        String countSql = "SELECT COUNT(*) FROM device_info d " + where;
        List<Map<String, Object>> rows = namedJdbcTemplate.queryForList(dataSql, params);
        long total = namedJdbcTemplate.queryForObject(countSql, params, Long.class);
        return new PagedResponse<>(200, "获取设备列表成功", rows, total);
    }

    public ApiResponse<Map<String, Object>> getDevice(Long id) {
        Map<String, Object> device = jdbcTemplate.queryForMap(
                "SELECT * FROM device_info WHERE id = ? AND showAble = 1",
                id
        );
        return ApiResponse.success("获取设备详情成功", device);
    }

    @Transactional
    public ApiResponse<Void> updateDevice(Long id, DeviceUpdateRequest request) {
        int updated = jdbcTemplate.update(
                "UPDATE device_info SET name = ?, radarHeight = ?, downAngle = ?, sceneId = ?, x_location = ?, y_location = ?, " +
                        "deltaX_room = ?, deltaY_room = ?, is_sendMessage = ?, wave_trigger = ?, fall_trigger = ?, LongLayDetect = ?, " +
                        "SelfCalib = ?, language = ? WHERE id = ?",
                request.getName(),
                request.getRadarHeight(),
                request.getDownAngle(),
                request.getSceneId(),
                request.getXLocation(),
                request.getYLocation(),
                request.getDeltaXRoom(),
                request.getDeltaYRoom(),
                request.getIsSendMessage(),
                request.getWaveTrigger(),
                request.getFallTrigger(),
                request.getLongLayDetect(),
                request.getSelfCalib(),
                request.getLanguage(),
                id
        );
        if (updated == 0) {
            return ApiResponse.failure(404, "设备不存在");
        }
        Map<String, Object> deviceRow = jdbcTemplate.queryForMap("SELECT * FROM device_info WHERE id = ?", id);
        smartLabClient.uploadDeviceInfo(deviceRow);
        return ApiResponse.success("设备更新成功", null);
    }

    @Transactional
    public ApiResponse<Void> deleteDevice(Long id) {
        int affected = jdbcTemplate.update("UPDATE device_info SET showAble = 2 WHERE id = ?", id);
        if (affected == 0) {
            return ApiResponse.failure(404, "设备不存在");
        }
        return ApiResponse.success("设备删除成功", null);
    }

    public ApiResponse<List<Map<String, Object>>> getDeviceWarns(String deviceId, LocalDate date) {
        List<Map<String, Object>> warns = jdbcTemplate.queryForList(
                "SELECT * FROM device_warns WHERE deviceid = ? AND DATE(currenttime) = ? ORDER BY currenttime DESC",
                deviceId,
                date
        );
        return ApiResponse.success("获取告警信息成功", warns);
    }
}
