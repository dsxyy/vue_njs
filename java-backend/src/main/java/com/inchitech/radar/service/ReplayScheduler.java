package com.inchitech.radar.service;

import com.inchitech.radar.integration.SmartLabClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReplayScheduler {

    private static final Logger log = LoggerFactory.getLogger(ReplayScheduler.class);

    private final JdbcTemplate jdbcTemplate;
    private final SmartLabClient smartLabClient;

    public ReplayScheduler(JdbcTemplate jdbcTemplate, SmartLabClient smartLabClient) {
        this.jdbcTemplate = jdbcTemplate;
        this.smartLabClient = smartLabClient;
    }

    @Scheduled(cron = "0 30 0 * * *")
    public void scheduleAt0030() {
        requestReplay(LocalDate.now().minusDays(1));
    }

    @Scheduled(cron = "0 30 1 * * *")
    public void scheduleAt0130() {
        requestReplay(LocalDate.now().minusDays(1));
    }

    public void requestReplay(LocalDate date) {
        String dateStr = date.getYear() + "-" + date.getMonthValue() + "-" + date.getDayOfMonth();
        List<Map<String, Object>> devices = jdbcTemplate.queryForList(
                "SELECT mac FROM device_info WHERE status = 1 AND showAble = 1"
        );
        if (devices.isEmpty()) {
            log.info("No online devices, skip replay request.");
            return;
        }
        for (Map<String, Object> device : devices) {
            String mac = String.valueOf(device.get("mac"));
            Map<String, Object> payload = new HashMap<>();
            payload.put("deviceID", mac);
            payload.put("datetime", dateStr);
            smartLabClient.requestReplay(payload);
        }
    }
}
