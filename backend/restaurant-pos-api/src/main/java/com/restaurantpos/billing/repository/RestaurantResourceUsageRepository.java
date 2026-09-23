package com.restaurantpos.billing.repository;

import com.restaurantpos.billing.entity.RestaurantResourceUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RestaurantResourceUsageRepository extends JpaRepository<RestaurantResourceUsage, UUID> {
    Optional<RestaurantResourceUsage> findByTenantId(UUID tenantId);
}
