package com.inchitech.radar.service;

import com.inchitech.radar.dto.ApiResponse;
import com.inchitech.radar.dto.PagedResponse;
import com.inchitech.radar.dto.VersionRequest;
import com.inchitech.radar.model.VersionInfo;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class VersionService {

    private final JdbcTemplate jdbcTemplate;
    private final NamedParameterJdbcTemplate namedJdbcTemplate;
    private final BeanPropertyRowMapper<VersionInfo> rowMapper = BeanPropertyRowMapper.newInstance(VersionInfo.class);
    private final Path uploadDir = Paths.get("uploads", "versions");

    public VersionService(JdbcTemplate jdbcTemplate, NamedParameterJdbcTemplate namedJdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        this.namedJdbcTemplate = namedJdbcTemplate;
    }

    public PagedResponse<VersionInfo> listVersions(String name, int page, int limit) {
        int pageSize = Math.max(limit, 1);
        int currentPage = Math.max(page, 1);
        int offset = (currentPage - 1) * pageSize;
        MapSqlParameterSource params = new MapSqlParameterSource();
        StringBuilder where = new StringBuilder("WHERE 1=1");
        if (name != null && !name.isBlank()) {
            where.append(" AND versionName LIKE :name");
            params.addValue("name", "%" + name + "%");
        }
        String dataSql = "SELECT * FROM version_info " + where + " ORDER BY id DESC LIMIT :limit OFFSET :offset";
        String countSql = "SELECT COUNT(*) FROM version_info " + where;
        params.addValue("limit", pageSize);
        params.addValue("offset", offset);
        List<VersionInfo> rows = namedJdbcTemplate.query(dataSql, params, rowMapper);
        long total = namedJdbcTemplate.queryForObject(countSql, params, Long.class);
        return new PagedResponse<>(200, "获取版本列表成功", rows, total);
    }

    @Transactional
    public ApiResponse<Map<String, Object>> createVersion(VersionRequest request) {
        jdbcTemplate.update(
                "INSERT INTO version_info (versionName, description, fileUrl, createTime) VALUES (?, ?, ?, ?)",
                request.getVersionName(),
                request.getDescription(),
                request.getFileUrl(),
                LocalDateTime.now()
        );
        Long id = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return ApiResponse.success("版本创建成功", Map.of("id", id));
    }

    @Transactional
    public ApiResponse<Void> updateVersion(Long id, VersionRequest request) {
        jdbcTemplate.update(
                "UPDATE version_info SET versionName = ?, description = ?, fileUrl = ? WHERE id = ?",
                request.getVersionName(),
                request.getDescription(),
                request.getFileUrl(),
                id
        );
        return ApiResponse.success("版本更新成功", null);
    }

    @Transactional
    public ApiResponse<Void> deleteVersion(Long id) {
        jdbcTemplate.update("DELETE FROM version_info WHERE id = ?", id);
        return ApiResponse.success("版本删除成功", null);
    }

    public ApiResponse<VersionInfo> getVersion(Long id) {
        VersionInfo info = jdbcTemplate.query("SELECT * FROM version_info WHERE id = ?", rowMapper, id)
                .stream()
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("版本不存在"));
        return ApiResponse.success("获取版本详情成功", info);
    }

    public ApiResponse<List<VersionInfo>> listAllVersions() {
        List<VersionInfo> rows = jdbcTemplate.query(
                "SELECT * FROM version_info ORDER BY id DESC",
                rowMapper
        );
        return ApiResponse.success("获取版本列表成功", rows);
    }

    public ApiResponse<Map<String, Object>> uploadVersionFile(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            return ApiResponse.failure(400, "请选择要上传的文件");
        }
        Files.createDirectories(uploadDir);
        String uniqueName = UUID.randomUUID() + getExtension(file.getOriginalFilename());
        Path target = uploadDir.resolve(uniqueName);
        file.transferTo(target);
        String fileUrl = "/upload/versions/" + uniqueName;
        Map<String, Object> payload = Map.of(
                "fileUrl", fileUrl,
                "fileName", file.getOriginalFilename()
        );
        return ApiResponse.success("文件上传成功", payload);
    }

    private String getExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf('.'));
    }
}
