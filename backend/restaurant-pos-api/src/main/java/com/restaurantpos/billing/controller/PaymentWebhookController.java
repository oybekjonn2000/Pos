package com.restaurantpos.billing.controller;

import com.restaurantpos.billing.dto.BillingDto;
import com.restaurantpos.billing.entity.SubscriptionPayment;
import com.restaurantpos.billing.repository.SubscriptionPaymentRepository;
import com.restaurantpos.billing.service.SubscriptionService;
import com.restaurantpos.common.exception.PosException;
import com.restaurantpos.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/webhooks/payment")
@RequiredArgsConstructor
@Tag(name = "Payment Webhook", description = "Incoming payment provider callbacks and webhooks")
public class PaymentWebhookController {

    private final SubscriptionService subscriptionService;
    private final SubscriptionPaymentRepository paymentRepository;

    @PostMapping("/{provider}")
    @Operation(summary = "Process incoming provider webhook callback (Click, Payme, Uzum, Mock)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleProviderWebhook(
            @PathVariable String provider,
            @RequestBody Map<String, Object> payload) {

        log.info("Received payment webhook from provider: {} with payload: {}", provider, payload);

        // Extract payment id or transaction reference
        Object paymentIdObj = payload.get("paymentId");
        if (paymentIdObj == null) {
            paymentIdObj = payload.get("merchant_trans_id");
        }
        if (paymentIdObj == null) {
            throw PosException.badRequest("Webhook payload must contain paymentId or merchant_trans_id");
        }

        UUID paymentId;
        try {
            paymentId = UUID.fromString(paymentIdObj.toString());
        } catch (IllegalArgumentException e) {
            throw PosException.badRequest("Noto'g'ri paymentId formati: " + paymentIdObj);
        }

        SubscriptionPayment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> PosException.notFound("To'lov topilmadi: " + paymentId));

        // Verify status / action from payload
        String status = (String) payload.getOrDefault("status", "PAID");
        String providerTxId = (String) payload.getOrDefault("provider_transaction_id", "WEBHOOK-" + UUID.randomUUID().toString().substring(0, 8));

        // Amount verification if passed
        if (payload.containsKey("amount")) {
            try {
                BigDecimal receivedAmount = new BigDecimal(payload.get("amount").toString());
                if (payment.getAmount().compareTo(receivedAmount) != 0) {
                    log.warn("Payment amount mismatch for payment {}: expected {}, received {}",
                            paymentId, payment.getAmount(), receivedAmount);
                    throw PosException.badRequest("To'lov summasi mos kelmadi!");
                }
            } catch (NumberFormatException ignored) {}
        }

        if ("PAID".equalsIgnoreCase(status) || "SUCCESS".equalsIgnoreCase(status)) {
            BillingDto.CurrentSubscriptionResponse result = subscriptionService.processPaymentSuccess(
                    payment.getId(), providerTxId, payload);
            return ResponseEntity.ok(ApiResponse.success(
                    Map.of("processed", true, "paymentId", payment.getId(), "status", "PAID", "subscriptionStatus", result.getStatus()),
                    "To'lov webhook orqali muvaffaqiyatli qabul qilindi"));
        } else {
            subscriptionService.processPaymentFailed(payment.getId(), "Provider rejected: " + status);
            return ResponseEntity.ok(ApiResponse.success(
                    Map.of("processed", true, "paymentId", payment.getId(), "status", "FAILED"),
                    "To'lov rad etildi"));
        }
    }
}
