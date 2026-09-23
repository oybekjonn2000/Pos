package com.restaurantpos.users.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class UserDto {

    @Getter
    @Setter
    public static class CreateRequest {
        @NotBlank(message = "Ism kiritilishi shart")
        private String firstName;

        private String lastName;

        @NotBlank(message = "Telefon raqami kiritilishi shart")
        private String phone;

        private String pin;

        @NotBlank(message = "Lavozim kiritilishi shart")
        private String role;

        private UUID roleId;
        private UUID kitchenId;
        private List<UUID> kitchenIds;

        // Admin-only fields (null for ordinary employees)
        private String username;
        private String password;
        private String email;
        private String authenticationType;
    }

    @Getter
    @Setter
    public static class UpdateRequest {
        @NotBlank(message = "Ism kiritilishi shart")
        private String firstName;

        private String lastName;
        private String email;
        private String phone;
        private String pin;
        private String role;
        private UUID roleId;
        private Boolean active;
        private UUID kitchenId;
        private List<UUID> kitchenIds;
    }

    @Getter
    @Setter
    public static class ChangePasswordRequest {
        @NotBlank(message = "New password is required")
        @Size(min = 4, message = "Password must be at least 4 characters")
        private String newPassword;
    }

    @Getter
    @Setter
    public static class ChangePinRequest {
        private String currentPinOrPassword;

        @NotBlank(message = "Yangi PIN kiritilishi shart")
        private String newPin;

        @NotBlank(message = "Yangi PIN tasdig'i kiritilishi shart")
        private String confirmPin;
    }

    @Getter
    @Setter
    @Builder
    public static class Response {
        private UUID id;
        private String username;
        private String firstName;
        private String lastName;
        private String fullName;
        private String email;
        private String phone;
        private boolean active;
        private String role;
        private UUID roleId;
        private String authenticationType;
        private boolean hasPin;
        private List<String> permissions;
        private UUID kitchenId;
        private String kitchenName;
        private String kitchenCode;
        private List<UUID> kitchenIds;
        private List<KitchenSummary> kitchens;
        private Instant lastLoginAt;
        private Instant createdAt;
    }

    @Getter
    @Setter
    @Builder
    public static class RoleResponse {
        private UUID id;
        private String name;
        private String description;
    }

    @Getter
    @Setter
    @lombok.AllArgsConstructor
    @lombok.NoArgsConstructor
    @Builder
    public static class KitchenSummary {
        private UUID id;
        private String name;
        private String code;
    }
}
