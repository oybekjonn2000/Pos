package com.restaurantpos.billing.repository;

import com.restaurantpos.billing.entity.SubscriptionDiscountRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubscriptionDiscountRuleRepository extends JpaRepository<SubscriptionDiscountRule, UUID> {
    List<SubscriptionDiscountRule> findAllByOrderByMinMonthsAsc();
    List<SubscriptionDiscountRule> findAllByActiveTrueOrderByMinMonthsDesc();
    Optional<SubscriptionDiscountRule> findByMinMonths(Integer minMonths);
}
