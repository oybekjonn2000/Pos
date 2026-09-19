package com.restaurantpos.billing.repository;

import com.restaurantpos.billing.entity.SubscriptionPayment;
import com.restaurantpos.billing.entity.SubscriptionPaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubscriptionPaymentRepository extends JpaRepository<SubscriptionPayment, UUID> {
    Optional<SubscriptionPayment> findByProviderTransactionId(String providerTransactionId);
    List<SubscriptionPayment> findAllByTenantIdOrderByCreatedAtDesc(UUID tenantId);
    List<SubscriptionPayment> findAllByOrderByCreatedAtDesc();
    
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM SubscriptionPayment p WHERE p.status = 'PAID'")
    BigDecimal sumTotalRevenue();

    long countByStatus(SubscriptionPaymentStatus status);
}
