package com.restaurantpos.billing.repository;

import com.restaurantpos.billing.entity.RestaurantSubscription;
import com.restaurantpos.billing.entity.SubscriptionStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RestaurantSubscriptionRepository extends JpaRepository<RestaurantSubscription, UUID> {
    Optional<RestaurantSubscription> findFirstByTenantIdAndStatusInOrderByCreatedAtDesc(UUID tenantId, Collection<SubscriptionStatus> statuses);
    Optional<RestaurantSubscription> findFirstByTenantIdOrderByCreatedAtDesc(UUID tenantId);
    List<RestaurantSubscription> findAllByTenantIdOrderByCreatedAtDesc(UUID tenantId);
    List<RestaurantSubscription> findAllByOrderByCreatedAtDesc();
    long countByStatus(SubscriptionStatus status);
    List<RestaurantSubscription> findByStatusInAndEndDateBefore(Collection<SubscriptionStatus> statuses, Instant cutoff);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM RestaurantSubscription s WHERE s.id = :id")
    Optional<RestaurantSubscription> findByIdForUpdate(@Param("id") UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM RestaurantSubscription s WHERE s.tenant.id = :tenantId ORDER BY s.createdAt DESC")
    List<RestaurantSubscription> findAllByTenantIdForUpdate(@Param("tenantId") UUID tenantId);
}
