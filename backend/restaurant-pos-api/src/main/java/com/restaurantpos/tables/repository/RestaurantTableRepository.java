package com.restaurantpos.tables.repository;

import com.restaurantpos.tables.entity.RestaurantTable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, UUID> {

    @Query("SELECT t FROM RestaurantTable t WHERE t.tenant.id = :tenantId AND t.deletedAt IS NULL " +
           "AND (t.zone IS NULL OR t.zone.deletedAt IS NULL) ORDER BY t.tableNumber ASC")
    List<RestaurantTable> findByTenantIdAndDeletedAtIsNullOrderByTableNumberAsc(@Param("tenantId") UUID tenantId);

    List<RestaurantTable> findByTenantIdAndZoneIdAndDeletedAtIsNullOrderByTableNumberAsc(UUID tenantId, UUID zoneId);

    Optional<RestaurantTable> findByIdAndTenantIdAndDeletedAtIsNull(UUID id, UUID tenantId);

    Optional<RestaurantTable> findByTenantIdAndTableNumberAndDeletedAtIsNull(UUID tenantId, String tableNumber);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM RestaurantTable t WHERE t.id = :id AND t.tenant.id = :tenantId AND t.deletedAt IS NULL")
    Optional<RestaurantTable> findByIdWithLock(@Param("id") UUID id, @Param("tenantId") UUID tenantId);

    /**
     * Soft-delete all active tables belonging to the given zone in a single batch update.
     * Called within the zone deletion transaction after active-order validation passes.
     */
    @Modifying
    @Query("UPDATE RestaurantTable t SET t.deletedAt = :now, t.active = false " +
           "WHERE t.zone.id = :zoneId AND t.tenant.id = :tenantId AND t.deletedAt IS NULL")
    int softDeleteByZoneId(@Param("zoneId") UUID zoneId,
                           @Param("tenantId") UUID tenantId,
                           @Param("now") Instant now);

    /**
     * Finds tables whose zone has been soft-deleted (zone.deletedAt IS NOT NULL) but the table
     * itself has not been soft-deleted — i.e., orphan tables left behind from old buggy deletions.
     */
    @Query("SELECT t FROM RestaurantTable t " +
           "WHERE t.tenant.id = :tenantId AND t.deletedAt IS NULL " +
           "AND t.zone IS NOT NULL AND t.zone.deletedAt IS NOT NULL")
    List<RestaurantTable> findOrphanTables(@Param("tenantId") UUID tenantId);

    /**
     * Soft-deletes any tables across all tenants whose zone has already been soft-deleted.
     */
    @Modifying
    @Query("UPDATE RestaurantTable t SET t.deletedAt = :now, t.active = false " +
           "WHERE t.deletedAt IS NULL AND t.zone IS NOT NULL AND t.zone.deletedAt IS NOT NULL")
    int softDeleteAllOrphanTables(@Param("now") Instant now);
}

