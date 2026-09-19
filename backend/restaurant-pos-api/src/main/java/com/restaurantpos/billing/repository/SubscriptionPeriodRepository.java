package com.restaurantpos.billing.repository;

import com.restaurantpos.billing.entity.SubscriptionPeriod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SubscriptionPeriodRepository extends JpaRepository<SubscriptionPeriod, UUID> {
    List<SubscriptionPeriod> findAllByTenantIdOrderByStartDateDesc(UUID tenantId);
    List<SubscriptionPeriod> findAllBySubscriptionIdOrderByStartDateDesc(UUID subscriptionId);
    List<SubscriptionPeriod> findAllByOrderByStartDateDesc();
}
