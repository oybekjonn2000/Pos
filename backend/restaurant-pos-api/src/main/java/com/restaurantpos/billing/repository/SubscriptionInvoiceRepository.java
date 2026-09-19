package com.restaurantpos.billing.repository;

import com.restaurantpos.billing.entity.InvoiceStatus;
import com.restaurantpos.billing.entity.SubscriptionInvoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubscriptionInvoiceRepository extends JpaRepository<SubscriptionInvoice, UUID> {
    Optional<SubscriptionInvoice> findByInvoiceNumber(String invoiceNumber);
    List<SubscriptionInvoice> findAllByTenantIdOrderByCreatedAtDesc(UUID tenantId);
    List<SubscriptionInvoice> findAllByOrderByCreatedAtDesc();
    long countByStatus(InvoiceStatus status);

    @Query("SELECT COALESCE(SUM(i.finalAmount), 0) FROM SubscriptionInvoice i WHERE i.status = 'PAID'")
    BigDecimal sumTotalPaidRevenue();

    @Query("SELECT COALESCE(SUM(i.discountAmount), 0) FROM SubscriptionInvoice i WHERE i.status = 'PAID'")
    BigDecimal sumTotalDiscounts();
}
