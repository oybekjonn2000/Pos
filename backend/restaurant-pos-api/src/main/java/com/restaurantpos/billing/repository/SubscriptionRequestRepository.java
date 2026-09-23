package com.restaurantpos.billing.repository;

import com.restaurantpos.billing.entity.SubscriptionRequest;
import com.restaurantpos.billing.entity.SubscriptionRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubscriptionRequestRepository extends JpaRepository<SubscriptionRequest, UUID> {

    List<SubscriptionRequest> findAllByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    Optional<SubscriptionRequest> findFirstByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    Optional<SubscriptionRequest> findFirstByTenantIdAndStatusOrderByCreatedAtDesc(UUID tenantId, SubscriptionRequestStatus status);

    List<SubscriptionRequest> findAllByStatusOrderByCreatedAtDesc(SubscriptionRequestStatus status);

    List<SubscriptionRequest> findAllByOrderByCreatedAtDesc();

    long countByStatus(SubscriptionRequestStatus status);

    @Query("SELECT r FROM SubscriptionRequest r " +
           "LEFT JOIN FETCH r.tenant " +
           "LEFT JOIN FETCH r.plan " +
           "LEFT JOIN FETCH r.requestedByUser " +
           "WHERE (:status IS NULL OR r.status = :status) " +
           "ORDER BY r.createdAt DESC")
    List<SubscriptionRequest> findWithDetailsByStatus(@Param("status") SubscriptionRequestStatus status);
}
