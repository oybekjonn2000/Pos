package com.restaurantpos.debt.repository;

import com.restaurantpos.debt.entity.Debt;
import com.restaurantpos.debt.entity.DebtStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DebtRepository extends JpaRepository<Debt, UUID> {

    List<Debt> findByTenantIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID tenantId);

    List<Debt> findByTenantIdAndCustomerIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID tenantId, UUID customerId);

    List<Debt> findByTenantIdAndStatusAndDeletedAtIsNull(UUID tenantId, DebtStatus status);

    Optional<Debt> findByTenantIdAndOrderIdAndDeletedAtIsNull(UUID tenantId, UUID orderId);

    Optional<Debt> findByTenantIdAndPaymentIdAndDeletedAtIsNull(UUID tenantId, UUID paymentId);
}
