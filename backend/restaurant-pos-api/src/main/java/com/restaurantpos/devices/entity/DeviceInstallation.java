package com.restaurantpos.devices.entity;

import com.restaurantpos.tenants.entity.Tenant;
import com.restaurantpos.users.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Represents a desktop installation bound to a specific restaurant/tenant (JOWI POS model).
 */
@Entity
@Table(name = "device_installations")
@Getter
@Setter
public class DeviceInstallation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "installation_id", nullable = false, unique = true, length = 100)
    private String installationId;

    @Column(name = "device_id", nullable = false, length = 100)
    private String deviceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @Column(name = "device_name", length = 255)
    private String deviceName;

    @Column(name = "device_type", length = 50)
    private String deviceType = "DESKTOP_POS";

    @Column(name = "os_info", length = 255)
    private String osInfo;

    @Column(name = "app_version", length = 50)
    private String appVersion;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private DeviceInstallationStatus status = DeviceInstallationStatus.ACTIVE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "last_user_id")
    private User lastUser;

    @Column(name = "activated_at", nullable = false, updatable = false)
    private Instant activatedAt = Instant.now();

    @Column(name = "last_seen_at")
    private Instant lastSeenAt = Instant.now();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public boolean isActive() {
        return status == DeviceInstallationStatus.ACTIVE;
    }

    public boolean isBlocked() {
        return status == DeviceInstallationStatus.BLOCKED;
    }

    public boolean isRevoked() {
        return status == DeviceInstallationStatus.REVOKED;
    }
}
