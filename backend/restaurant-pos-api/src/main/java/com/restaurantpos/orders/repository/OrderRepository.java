package com.restaurantpos.orders.repository;

import com.restaurantpos.orders.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {

    List<Order> findByTenantIdAndDeletedAtIsNullOrderByOpenedAtDesc(UUID tenantId);

    List<Order> findByTenantIdAndStatusInAndDeletedAtIsNullOrderByOpenedAtDesc(UUID tenantId, List<Order.OrderStatus> statuses);

    Optional<Order> findByIdAndTenantIdAndDeletedAtIsNull(UUID id, UUID tenantId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Order o WHERE o.id = :id AND o.tenant.id = :tenantId AND o.deletedAt IS NULL")
    Optional<Order> findByIdWithLock(@Param("id") UUID id, @Param("tenantId") UUID tenantId);

    Optional<Order> findByTenantIdAndOrderNumber(UUID tenantId, String orderNumber);

    Optional<Order> findByTableIdAndStatusInAndDeletedAtIsNull(UUID tableId, List<Order.OrderStatus> statuses);

    List<Order.OrderStatus> ACTIVE_STATUSES = List.of(
            Order.OrderStatus.OPEN,
            Order.OrderStatus.IN_PROGRESS,
            Order.OrderStatus.READY,
            Order.OrderStatus.CLOSED
    );

    List<Order.OrderStatus> HISTORY_STATUSES = List.of(
            Order.OrderStatus.PAID
    );

    @Query("SELECT o FROM Order o WHERE o.tenant.id = :tenantId AND o.deletedAt IS NULL " +
           "AND ((o.status IN ('OPEN','IN_PROGRESS','READY')) OR (o.status = 'CLOSED' AND o.paymentStatus = 'UNPAID')) " +
           "ORDER BY o.openedAt DESC")
    List<Order> findActiveOrders(@Param("tenantId") UUID tenantId);

    @Query("SELECT o FROM Order o WHERE o.tenant.id = :tenantId AND o.waiter.id = :waiterId AND o.deletedAt IS NULL " +
           "AND ((o.status IN ('OPEN','IN_PROGRESS','READY')) OR (o.status = 'CLOSED' AND o.paymentStatus = 'UNPAID')) " +
           "ORDER BY o.openedAt DESC")
    List<Order> findActiveOrdersByWaiter(@Param("tenantId") UUID tenantId, @Param("waiterId") UUID waiterId);

    @Query("SELECT o FROM Order o WHERE o.tenant.id = :tenantId AND o.deletedAt IS NULL " +
           "AND (o.status = 'PAID' OR o.paymentStatus = 'PAID') " +
           "ORDER BY COALESCE(o.paidAt, o.closedAt, o.openedAt) DESC")
    List<Order> findHistoryOrders(@Param("tenantId") UUID tenantId);

    List<Order> findByTenantIdAndStatusInAndWaiterIdAndDeletedAtIsNullOrderByOpenedAtDesc(UUID tenantId, List<Order.OrderStatus> statuses, UUID waiterId);

    @Query("SELECT o FROM Order o WHERE o.tenant.id = :tenantId AND o.waiter.id = :waiterId AND o.deletedAt IS NULL " +
           "AND (o.status = 'PAID' OR o.paymentStatus = 'PAID') " +
           "ORDER BY COALESCE(o.paidAt, o.closedAt, o.openedAt) DESC")
    List<Order> findHistoryOrdersByWaiter(@Param("tenantId") UUID tenantId, @Param("waiterId") UUID waiterId);

    org.springframework.data.domain.Page<Order> findByTenantIdAndStatusInAndDeletedAtIsNullOrderByOpenedAtDesc(
            UUID tenantId, List<Order.OrderStatus> statuses, org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<Order> findByTenantIdAndStatusInAndWaiterIdAndDeletedAtIsNullOrderByOpenedAtDesc(
            UUID tenantId, List<Order.OrderStatus> statuses, UUID waiterId, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.tenant.id = :tenantId AND o.deletedAt IS NULL " +
           "AND ((o.status IN ('OPEN','IN_PROGRESS','READY')) OR (o.status = 'CLOSED' AND o.paymentStatus = 'UNPAID')) " +
           "ORDER BY o.openedAt DESC")
    org.springframework.data.domain.Page<Order> findActiveOrders(@Param("tenantId") UUID tenantId, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.tenant.id = :tenantId AND o.waiter.id = :waiterId AND o.deletedAt IS NULL " +
           "AND ((o.status IN ('OPEN','IN_PROGRESS','READY')) OR (o.status = 'CLOSED' AND o.paymentStatus = 'UNPAID')) " +
           "ORDER BY o.openedAt DESC")
    org.springframework.data.domain.Page<Order> findActiveOrdersByWaiter(@Param("tenantId") UUID tenantId, @Param("waiterId") UUID waiterId, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.tenant.id = :tenantId AND o.deletedAt IS NULL " +
           "AND (o.status = 'PAID' OR o.paymentStatus = 'PAID') " +
           "ORDER BY COALESCE(o.paidAt, o.closedAt, o.openedAt) DESC")
    org.springframework.data.domain.Page<Order> findHistoryOrders(@Param("tenantId") UUID tenantId, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.tenant.id = :tenantId AND o.waiter.id = :waiterId AND o.deletedAt IS NULL " +
           "AND (o.status = 'PAID' OR o.paymentStatus = 'PAID') " +
           "ORDER BY COALESCE(o.paidAt, o.closedAt, o.openedAt) DESC")
    org.springframework.data.domain.Page<Order> findHistoryOrdersByWaiter(@Param("tenantId") UUID tenantId, @Param("waiterId") UUID waiterId, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.tenant.id = :tenantId AND o.deletedAt IS NULL " +
           "AND (o.status = :status OR o.paymentStatus = 'PAID') " +
           "AND o.paidAt BETWEEN :from AND :to")
    List<Order> findByTenantIdAndStatusAndPaidAtBetweenAndDeletedAtIsNull(
            @Param("tenantId") UUID tenantId, 
            @Param("status") Order.OrderStatus status, 
            @Param("from") Instant from, 
            @Param("to") Instant to);

    @Query("SELECT o FROM Order o WHERE o.tenant.id = :tenantId AND o.waiter.id = :waiterId AND o.deletedAt IS NULL " +
           "AND (o.status = :status OR o.paymentStatus = 'PAID') " +
           "AND o.paidAt BETWEEN :from AND :to")
    List<Order> findByTenantIdAndStatusAndPaidAtBetweenAndWaiterIdAndDeletedAtIsNull(
            @Param("tenantId") UUID tenantId, 
            @Param("status") Order.OrderStatus status, 
            @Param("from") Instant from, 
            @Param("to") Instant to, 
            @Param("waiterId") UUID waiterId);

    List<Order> findByTenantIdAndStatusAndClosedAtBetweenAndDeletedAtIsNull(UUID tenantId, Order.OrderStatus status, Instant from, Instant to);

    List<Order> findByTenantIdAndStatusAndClosedAtBetweenAndWaiterIdAndDeletedAtIsNull(UUID tenantId, Order.OrderStatus status, Instant from, Instant to, UUID waiterId);

    List<Order> findByTenantIdAndOpenedAtBetweenAndDeletedAtIsNull(UUID tenantId, Instant from, Instant to);

    long countByTenantIdAndStatusAndOpenedAtBetweenAndDeletedAtIsNull(UUID tenantId, Order.OrderStatus status, Instant from, Instant to);

    long countByTenantIdAndStatusAndClosedAtBetweenAndDeletedAtIsNull(UUID tenantId, Order.OrderStatus status, Instant from, Instant to);

    /**
     * Finds active (not closed/paid/cancelled) orders for any table belonging to a given zone.
     * Used in zone-deletion validation to block deletion if active orders exist.
     */
    @Query("SELECT o FROM Order o WHERE o.tenant.id = :tenantId " +
           "AND (o.table.zone.id = :zoneId OR o.zone.id = :zoneId) " +
           "AND o.deletedAt IS NULL " +
           "AND (o.status NOT IN ('PAID', 'CANCELLED', 'REFUNDED') " +
           "     OR (o.status = 'CLOSED' AND (o.paymentStatus IS NULL OR o.paymentStatus <> 'PAID')))")
    List<Order> findActiveOrdersByZoneId(@Param("tenantId") UUID tenantId, @Param("zoneId") UUID zoneId);

    long countByDeletedAtIsNull();

    long countByOpenedAtBetweenAndDeletedAtIsNull(Instant from, Instant to);

    long countByTenantIdAndDeletedAtIsNull(UUID tenantId);

    long countByTenantIdAndOpenedAtBetweenAndDeletedAtIsNull(UUID tenantId, Instant from, Instant to);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.tenant.id = :tenantId AND o.deletedAt IS NULL AND (o.status = :status OR o.paymentStatus = 'PAID')")
    long countByTenantIdAndStatusAndDeletedAtIsNull(@Param("tenantId") UUID tenantId, @Param("status") Order.OrderStatus status);

    org.springframework.data.domain.Page<Order> findByTenantIdAndDeletedAtIsNullOrderByOpenedAtDesc(UUID tenantId, org.springframework.data.domain.Pageable pageable);

    java.util.Optional<Order> findFirstByTenantIdAndDeletedAtIsNullOrderByOpenedAtDesc(UUID tenantId);
}

