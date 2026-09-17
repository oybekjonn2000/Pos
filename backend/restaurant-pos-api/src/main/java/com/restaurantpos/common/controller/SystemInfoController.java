package com.restaurantpos.common.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Public LAN Discovery and System Diagnostics Controller.
 * Enables client terminals (Waiters, Kitchens, Cashiers) to test connection,
 * auto-discover central server, check database status, and synchronize clocks.
 */
@Slf4j
@RestController
@RequestMapping("/api/system")
@RequiredArgsConstructor
@Tag(name = "System Info", description = "Public LAN discovery and system health endpoints")
public class SystemInfoController {

    private final JdbcTemplate jdbcTemplate;

    @Value("${server.port:8080}")
    private int serverPort;

    @GetMapping("/lan-info")
    @Operation(summary = "Get central server status, database health, and LAN connection info")
    public ResponseEntity<Map<String, Object>> getLanInfo() {
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("status", "ONLINE");
        info.put("serverName", "Restaurant POS Central Server");
        info.put("version", "1.0.0");
        info.put("port", serverPort);
        info.put("serverTime", Instant.now().toString());
        info.put("timestamp", System.currentTimeMillis());

        // Test database connectivity
        String dbStatus = "CONNECTED";
        try {
            Integer testResult = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            if (testResult == null || testResult != 1) {
                dbStatus = "DEGRADED";
            }
        } catch (Exception e) {
            log.error("Central database check failed: {}", e.getMessage());
            dbStatus = "DISCONNECTED";
        }
        info.put("databaseStatus", dbStatus);

        return ResponseEntity.ok(info);
    }

    @GetMapping("/health")
    @Operation(summary = "Lightweight health ping")
    public ResponseEntity<Map<String, Object>> getHealth() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "timestamp", System.currentTimeMillis()
        ));
    }
}
