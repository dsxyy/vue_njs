package com.inchitech.radar.repository;

import com.inchitech.radar.model.SysUser;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class SysUserRepository {

    private final JdbcTemplate jdbcTemplate;
    private final BeanPropertyRowMapper<SysUser> rowMapper = BeanPropertyRowMapper.newInstance(SysUser.class);

    public SysUserRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<SysUser> findByName(String name) {
        return jdbcTemplate.query("SELECT id, name, password FROM sys_user_info WHERE name = ?", rowMapper, name)
                .stream()
                .findFirst();
    }
}
