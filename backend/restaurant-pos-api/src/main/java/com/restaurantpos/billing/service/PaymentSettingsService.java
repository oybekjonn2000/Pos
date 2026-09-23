package com.restaurantpos.billing.service;

import com.restaurantpos.billing.dto.BillingDto;
import com.restaurantpos.billing.entity.PaymentProviderSetting;
import com.restaurantpos.billing.repository.PaymentProviderSettingRepository;
import com.restaurantpos.common.exception.PosException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentSettingsService {

    private final PaymentProviderSettingRepository repository;

    private static final String MASKED = "••••••••";

    @Transactional(readOnly = true)
    public List<BillingDto.PaymentProviderSettingResponse> getAllProviderSettings() {
        return repository.findAllByOrderByCreatedAtAsc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BillingDto.PaymentProviderSettingResponse getByCode(String providerCode) {
        PaymentProviderSetting setting = repository.findByProviderCode(providerCode.trim().toUpperCase())
                .orElseThrow(() -> PosException.notFound("To'lov provayderi topilmadi: " + providerCode));
        return toResponse(setting);
    }

    @Transactional
    public BillingDto.PaymentProviderSettingResponse updateSetting(UUID id, BillingDto.PaymentProviderSettingUpdateRequest request) {
        PaymentProviderSetting setting = repository.findById(id)
                .orElseThrow(() -> PosException.notFound("To'lov sozlamasi topilmadi: " + id));

        applyUpdate(setting, request);
        PaymentProviderSetting saved = repository.save(setting);
        log.info("Updated payment provider setting: {} (enabled={})", saved.getProviderCode(), saved.isEnabled());
        return toResponse(saved);
    }

    @Transactional
    public BillingDto.PaymentProviderSettingResponse updateSettingByCode(String providerCode, BillingDto.PaymentProviderSettingUpdateRequest request) {
        PaymentProviderSetting setting = repository.findByProviderCode(providerCode.trim().toUpperCase())
                .orElseThrow(() -> PosException.notFound("To'lov sozlamasi topilmadi: " + providerCode));

        applyUpdate(setting, request);
        PaymentProviderSetting saved = repository.save(setting);
        log.info("Updated payment provider setting by code: {} (enabled={})", saved.getProviderCode(), saved.isEnabled());
        return toResponse(saved);
    }

    private void applyUpdate(PaymentProviderSetting setting, BillingDto.PaymentProviderSettingUpdateRequest request) {
        if (request.getEnabled() != null) {
            setting.setEnabled(request.getEnabled());
        }
        if (request.getTestMode() != null) {
            setting.setTestMode(request.getTestMode());
        }
        if (request.getMerchantId() != null) {
            setting.setMerchantId(request.getMerchantId().trim());
        }
        if (request.getCallbackUrl() != null) {
            setting.setCallbackUrl(request.getCallbackUrl().trim());
        }
        if (request.getDisplayName() != null && !request.getDisplayName().isBlank()) {
            setting.setDisplayName(request.getDisplayName().trim());
        }
        if (request.getDescription() != null) {
            setting.setDescription(request.getDescription().trim());
        }

        // Only update API key if provided and not masked placeholder
        if (request.getApiKey() != null && !request.getApiKey().isBlank() && !request.getApiKey().contains("••")) {
            setting.setApiKey(request.getApiKey().trim());
        }
        // Only update Secret key if provided and not masked placeholder
        if (request.getSecretKey() != null && !request.getSecretKey().isBlank() && !request.getSecretKey().contains("••")) {
            setting.setSecretKey(request.getSecretKey().trim());
        }
    }

    private BillingDto.PaymentProviderSettingResponse toResponse(PaymentProviderSetting s) {
        boolean hasApi = s.getApiKey() != null && !s.getApiKey().isBlank();
        boolean hasSec = s.getSecretKey() != null && !s.getSecretKey().isBlank();

        return BillingDto.PaymentProviderSettingResponse.builder()
                .id(s.getId())
                .providerCode(s.getProviderCode())
                .displayName(s.getDisplayName())
                .enabled(s.isEnabled())
                .testMode(s.isTestMode())
                .merchantId(s.getMerchantId())
                .maskedApiKey(hasApi ? MASKED : null)
                .maskedSecretKey(hasSec ? MASKED : null)
                .hasApiKey(hasApi)
                .hasSecretKey(hasSec)
                .callbackUrl(s.getCallbackUrl())
                .description(s.getDescription())
                .updatedAt(s.getUpdatedAt())
                .build();
    }
}
