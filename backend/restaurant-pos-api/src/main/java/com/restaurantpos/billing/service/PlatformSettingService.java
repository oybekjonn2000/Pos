package com.restaurantpos.billing.service;

import com.restaurantpos.billing.dto.PaymentCardSettingsDto;
import com.restaurantpos.billing.entity.PlatformSetting;
import com.restaurantpos.billing.repository.PlatformSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlatformSettingService {

    private final PlatformSettingRepository settingRepository;

    private static final String DEFAULT_CARD = "8600 0000 0000 0000";
    private static final String DEFAULT_HOLDER = "Platform Administrator";
    private static final String DEFAULT_BANK = "Kapitalbank";
    private static final String DEFAULT_INSTRUCTIONS = "Iltimos, to'lov izohiga restoraningiz nomini yozing va to'lov chekini yuklang.";

    @Transactional(readOnly = true)
    public PaymentCardSettingsDto.Response getPaymentCardSettings() {
        return settingRepository.findFirstByOrderByUpdatedAtDesc()
                .map(this::toResponse)
                .orElseGet(() -> PaymentCardSettingsDto.Response.builder()
                        .cardNumber(DEFAULT_CARD)
                        .cardHolder(DEFAULT_HOLDER)
                        .bankName(DEFAULT_BANK)
                        .instructions(DEFAULT_INSTRUCTIONS)
                        .updatedAt(Instant.now())
                        .build());
    }

    @Transactional
    public PaymentCardSettingsDto.Response updatePaymentCardSettings(PaymentCardSettingsDto.UpdateRequest request) {
        PlatformSetting setting = settingRepository.findFirstByOrderByUpdatedAtDesc()
                .orElseGet(PlatformSetting::new);

        if (request.getCardNumber() != null && !request.getCardNumber().isBlank()) {
            setting.setPaymentCardNumber(request.getCardNumber().trim());
        }
        if (request.getCardHolder() != null && !request.getCardHolder().isBlank()) {
            setting.setPaymentCardHolder(request.getCardHolder().trim());
        }
        if (request.getBankName() != null && !request.getBankName().isBlank()) {
            setting.setPaymentBankName(request.getBankName().trim());
        }
        if (request.getInstructions() != null) {
            setting.setPaymentInstructions(request.getInstructions().trim());
        }
        setting.setUpdatedAt(Instant.now());

        PlatformSetting saved = settingRepository.save(setting);
        log.info("Platform payment card settings updated by Super Admin: card ending in {}",
                saved.getPaymentCardNumber() != null && saved.getPaymentCardNumber().length() > 4
                        ? saved.getPaymentCardNumber().substring(saved.getPaymentCardNumber().length() - 4)
                        : "N/A");

        return toResponse(saved);
    }

    private PaymentCardSettingsDto.Response toResponse(PlatformSetting s) {
        return PaymentCardSettingsDto.Response.builder()
                .cardNumber(s.getPaymentCardNumber() != null ? s.getPaymentCardNumber() : DEFAULT_CARD)
                .cardHolder(s.getPaymentCardHolder() != null ? s.getPaymentCardHolder() : DEFAULT_HOLDER)
                .bankName(s.getPaymentBankName() != null ? s.getPaymentBankName() : DEFAULT_BANK)
                .instructions(s.getPaymentInstructions() != null ? s.getPaymentInstructions() : DEFAULT_INSTRUCTIONS)
                .updatedAt(s.getUpdatedAt())
                .build();
    }
}
