package com.restaurantpos.billing.repository;

import com.restaurantpos.billing.entity.SubscriptionFeature;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubscriptionFeatureRepository extends JpaRepository<SubscriptionFeature, UUID> {
    Optional<SubscriptionFeature> findByCode(String code);
    boolean existsByCode(String code);
}
