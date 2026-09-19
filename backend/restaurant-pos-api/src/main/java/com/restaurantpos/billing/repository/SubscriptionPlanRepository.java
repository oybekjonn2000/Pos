package com.restaurantpos.billing.repository;

import com.restaurantpos.billing.entity.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, UUID> {
    Optional<SubscriptionPlan> findByCodeAndActiveTrue(String code);
    Optional<SubscriptionPlan> findByCode(String code);
    List<SubscriptionPlan> findAllByActiveTrueOrderByPriceAsc();
    List<SubscriptionPlan> findAllByOrderByCreatedAtDesc();
}
