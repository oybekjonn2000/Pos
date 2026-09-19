package com.restaurantpos.billing.repository;

import com.restaurantpos.billing.entity.RestaurantSubscription;
import com.restaurantpos.billing.entity.SubscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
