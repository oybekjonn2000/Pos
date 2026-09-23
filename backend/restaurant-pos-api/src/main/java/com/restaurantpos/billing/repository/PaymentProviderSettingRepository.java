package com.restaurantpos.billing.repository;

import com.restaurantpos.billing.entity.PaymentProviderSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentProviderSettingRepository extends JpaRepository<PaymentProviderSetting, UUID> {
    Optional<PaymentProviderSetting> findByProviderCode(String providerCode);
    List<PaymentProviderSetting> findAllByOrderByCreatedAtAsc();
    List<PaymentProviderSetting> findAllByEnabledTrue();
}
