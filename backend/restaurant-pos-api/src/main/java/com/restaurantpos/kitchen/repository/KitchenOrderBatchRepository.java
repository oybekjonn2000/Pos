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

    Optional<KitchenOrderBatch> findTopByOrderIdOrderByBatchNumberDesc(UUID orderId);

    Optional<KitchenOrderBatch> findByIdAndTenantId(UUID id, UUID tenantId);

    long countByOrderId(UUID orderId);
}
