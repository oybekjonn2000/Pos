package com.restaurantpos.billing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

public class PaymentCardSettingsDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private String cardNumber;
        private String cardHolder;
        private String bankName;
        private String instructions;
        private Instant updatedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateRequest {
        private String cardNumber;
        private String cardHolder;
        private String bankName;
        private String instructions;
    }
}
