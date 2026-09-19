package com.restaurantpos.payments.repository;

import com.restaurantpos.payments.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    List<Payment> findByOrderId(UUID orderId);

    List<Payment> findByTenantIdOrderByPaidAtDesc(UUID tenantId);

    List<Payment> findByShiftId(UUID shiftId);

    Optional<Payment> findByIdAndTenantId(UUID id, UUID tenantId);

    List<Payment> findByTenantIdAndPaidAtBetween(UUID tenantId, Instant from, Instant to);

    // Reports uchun
    List<Payment> findByTenantIdAndPaidAtBetweenAndRefundFalse(UUID tenantId, Instant from, Instant to);

    List<Payment> findByTenantIdAndPaidAtBetweenAndRefundTrue(UUID tenantId, Instant from, Instant to);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.refund = false AND p.paidAt >= :from AND p.paidAt <= :to")
    java.math.BigDecimal sumTotalAmountBetween(@org.springframework.data.repository.query.Param("from") Instant from, @org.springframework.data.repository.query.Param("to") Instant to);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.refund = false")
    java.math.BigDecimal sumTotalAmount();

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.tenant.id = :tenantId AND p.refund = false AND p.paidAt >= :from AND p.paidAt <= :to")
    java.math.BigDecimal sumTenantAmountBetween(@org.springframework.data.repository.query.Param("tenantId") UUID tenantId, @org.springframework.data.repository.query.Param("from") Instant from, @org.springframework.data.repository.query.Param("to") Instant to);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.tenant.id = :tenantId AND p.refund = false")
    java.math.BigDecimal sumTenantTotalAmount(@org.springframework.data.repository.query.Param("tenantId") UUID tenantId);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.tenant.id = :tenantId AND p.paymentMethod = :method AND p.refund = false AND p.paidAt >= :from AND p.paidAt <= :to")
    java.math.BigDecimal sumTenantAmountByMethodBetween(@org.springframework.data.repository.query.Param("tenantId") UUID tenantId, @org.springframework.data.repository.query.Param("method") com.restaurantpos.payments.entity.Payment.PaymentMethod method, @org.springframework.data.repository.query.Param("from") Instant from, @org.springframework.data.repository.query.Param("to") Instant to);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(p) FROM Payment p WHERE p.refund = false AND p.paidAt >= :from AND p.paidAt <= :to")
    long countPaymentsBetween(@org.springframework.data.repository.query.Param("from") Instant from, @org.springframework.data.repository.query.Param("to") Instant to);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(p) FROM Payment p WHERE p.tenant.id = :tenantId AND p.refund = false AND p.paidAt >= :from AND p.paidAt <= :to")
    long countTenantPaymentsBetween(@org.springframework.data.repository.query.Param("tenantId") UUID tenantId, @org.springframework.data.repository.query.Param("from") Instant from, @org.springframework.data.repository.query.Param("to") Instant to);

    java.util.Optional<Payment> findFirstByTenantIdOrderByPaidAtDesc(UUID tenantId);
}
