package com.restaurantpos.devices.repository;

import com.restaurantpos.devices.entity.DeviceInstallation;
import com.restaurantpos.devices.entity.DeviceInstallationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DeviceInstallationRepository extends JpaRepository<DeviceInstallation, UUID> {

    Optional<DeviceInstallation> findByInstallationId(String installationId);

    Optional<DeviceInstallation> findByDeviceId(String deviceId);

    List<DeviceInstallation> findAllByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    long countByTenantIdAndStatus(UUID tenantId, DeviceInstallationStatus status);

    @Query("SELECT di FROM DeviceInstallation di LEFT JOIN FETCH di.tenant LEFT JOIN FETCH di.lastUser ORDER BY di.lastSeenAt DESC NULLS LAST, di.createdAt DESC")
    List<DeviceInstallation> findAllWithTenantAndLastUser();

    Optional<DeviceInstallation> findByInstallationIdAndTenantId(String installationId, UUID tenantId);

    boolean existsByInstallationId(String installationId);

    boolean existsByDeviceId(String deviceId);
}
