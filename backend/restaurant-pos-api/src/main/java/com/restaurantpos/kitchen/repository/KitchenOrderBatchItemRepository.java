package com.restaurantpos.kitchen.repository;

import com.restaurantpos.kitchen.entity.KitchenOrderBatchItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface KitchenOrderBatchItemRepository extends JpaRepository<KitchenOrderBatchItem, UUID> {

    List<KitchenOrderBatchItem> findByBatchId(UUID batchId);

    List<KitchenOrderBatchItem> findByOrderItemId(UUID orderItemId);

    Optional<KitchenOrderBatchItem> findByIdAndTenantId(UUID id, UUID tenantId);
}
