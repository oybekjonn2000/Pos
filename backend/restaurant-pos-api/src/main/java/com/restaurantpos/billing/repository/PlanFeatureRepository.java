package com.restaurantpos.billing.repository;

import com.restaurantpos.billing.entity.PlanFeature;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlanFeatureRepository extends JpaRepository<PlanFeature, UUID> {
    List<PlanFeature> findAllByPlanId(UUID planId);
    List<PlanFeature> findAllByPlanIdAndEnabledTrue(UUID planId);
    Optional<PlanFeature> findByPlanIdAndFeatureId(UUID planId, UUID featureId);
    Optional<PlanFeature> findByPlanIdAndFeatureCode(UUID planId, String featureCode);
    boolean existsByPlanIdAndFeatureId(UUID planId, UUID featureId);
}
