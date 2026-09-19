package com.restaurantpos.billing.service;

import com.restaurantpos.billing.dto.BillingDto;
import com.restaurantpos.billing.entity.SubscriptionAuditLog;
import com.restaurantpos.billing.repository.SubscriptionAuditLogRepository;
import com.restaurantpos.tenants.entity.Tenant;
import com.restaurantpos.users.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionAuditService {

    private final SubscriptionAuditLogRepository auditLogRepository;

    @Transactional
    public void log(Tenant tenant, User user, String username, String role,
                    String action, String entityType, UUID entityId,
                    Map<String, Object> details) {
        try {
            SubscriptionAuditLog audit = new SubscriptionAuditLog();
            audit.setTenant(tenant);
            audit.setUser(user);
            audit.setUsername(username != null ? username : (user != null ? user.getUsername() : "SYSTEM"));
            audit.setRole(role != null ? role : (user != null && user.getRoles() != null && !user.getRoles().isEmpty() ? user.getRoles().iterator().next().getName() : "SYSTEM"));
            audit.setAction(action);
            audit.setEntityType(entityType);
            audit.setEntityId(entityId);
            audit.setDetails(details);
            audit.setCreatedAt(Instant.now());

            auditLogRepository.save(audit);
            log.debug("Subscription audit logged: {} on {} (ID: {})", action, entityType, entityId);
        } catch (Exception ex) {
            log.error("Failed to persist subscription audit log: {}", ex.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<BillingDto.AuditLogResponse> getRecentAuditLogs() {
        return auditLogRepository.findTop100ByOrderByCreatedAtDesc().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BillingDto.AuditLogResponse> getTenantAuditLogs(UUID tenantId) {
        return auditLogRepository.findAllByTenantIdOrderByCreatedAtDesc(tenantId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private BillingDto.AuditLogResponse toDto(SubscriptionAuditLog log) {
        return BillingDto.AuditLogResponse.builder()
                .id(log.getId())
                .tenantId(log.getTenant() != null ? log.getTenant().getId() : null)
                .restaurantName(log.getTenant() != null ? log.getTenant().getName() : "System")
                .userId(log.getUser() != null ? log.getUser().getId() : null)
                .username(log.getUsername())
                .role(log.getRole())
                .action(log.getAction())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .details(log.getDetails())
                .ipAddress(log.getIpAddress())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
