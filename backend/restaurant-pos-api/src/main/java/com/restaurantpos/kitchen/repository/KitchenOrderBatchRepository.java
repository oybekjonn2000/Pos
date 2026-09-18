package com.restaurantpos.kitchen.repository;

import com.restaurantpos.kitchen.entity.KitchenOrderBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Repository
public interface KitchenOrderBatchRepository extends JpaRepository<KitchenOrderBatch, UUID> {

    List<KitchenOrderBatch> findByTenantIdAndKitchenIdAndStatusInOrderByCreatedAtAsc(
            UUID tenantId, UUID kitchenId, Collection<KitchenOrderBatch.BatchStatus> statuses);

    List<KitchenOrderBatch> findByTenantIdAndKitchenIdInAndStatusInOrderByCreatedAtAsc(
            UUID tenantId, Set<UUID> kitchenIds, Collection<KitchenOrderBatch.BatchStatus> statuses);

    List<KitchenOrderBatch> findByTenantIdAndStatusInOrderByCreatedAtAsc(
            UUID tenantId, Collection<KitchenOrderBatch.BatchStatus> statuses);

    List<KitchenOrderBatch> findByTenantIdAndOrderIdOrderByBatchNumberAsc(UUID tenantId, UUID orderId);

    @org.springframework.data.jpa.repository.Query("SELECT b FROM KitchenOrderBatch b WHERE b.tenant.id = :tenantId AND b.order.table.id = :tableId AND b.status IN :statuses ORDER BY b.createdAt ASC")
    List<KitchenOrderBatch> findByTableIdAndStatuses(
            @org.springframework.data.repository.query.Param("tenantId") UUID tenantId,
            @org.springframework.data.repository.query.Param("tableId") UUID tableId,
            @org.springframework.data.repository.query.Param("statuses") Collection<KitchenOrderBatch.BatchStatus> statuses);

    @org.springframework.data.jpa.repository.Query("SELECT b FROM KitchenOrderBatch b WHERE b.tenant.id = :tenantId AND b.order.id = :orderId AND b.status IN :statuses ORDER BY b.createdAt ASC")
    List<KitchenOrderBatch> findByOrderIdAndStatuses(
            @org.springframework.data.repository.query.Param("tenantId") UUID tenantId,
            @org.springframework.data.repository.query.Param("orderId") UUID orderId,
            @org.springframework.data.repository.query.Param("statuses") Collection<KitchenOrderBatch.BatchStatus> statuses);

    Optional<KitchenOrderBatch> findTopByOrderIdOrderByBatchNumberDesc(UUID orderId);

    Optional<KitchenOrderBatch> findByIdAndTenantId(UUID id, UUID tenantId);

    long countByOrderId(UUID orderId);
}
