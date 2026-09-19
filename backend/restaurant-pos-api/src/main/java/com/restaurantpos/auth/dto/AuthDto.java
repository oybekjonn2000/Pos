package com.restaurantpos.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

public class AuthDto {

    @Getter
    @Setter
    public static class LoginRequest {
        @NotBlank(message = "Username is required")
        private String username;

        @NotBlank(message = "Password is required")
        @Size(min = 4, max = 100)
        private String password;

        private String deviceId;
        private String restaurantCode;
    }

    @Getter
    @Setter
    public static class PinLoginRequest {
        @NotBlank(message = "PIN is required")
        @Size(min = 4, max = 8)
        private String pin;

        private String deviceId;
        private String restaurantCode;
    }

    @Getter
    @Setter
    public static class RefreshTokenRequest {
        @NotBlank(message = "Refresh token is required")
        private String refreshToken;
    }

    @Getter
    @Setter
    public static class ChangePasswordRequest {
        @NotBlank
        private String currentPassword;

        @NotBlank
        @Size(min = 6, max = 100)
        private String newPassword;
    }

    @Getter
    @Setter
    public static class RegisterRequest {
        private String ownerName;
        private String firstName;
        private String lastName;
        private String username;

        @NotBlank(message = "Phone is required")
        private String phone;

        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 6, max = 100, message = "Password must be at least 6 characters")
        private String password;

        private String confirmPassword;

        @NotBlank(message = "Restaurant name is required")
        private String restaurantName;

        private String restaurantPhone;
        private String restaurantCode;
        private String address;
        private String city;
        private String district;
        private String inn;
        private String logoUrl;
        private String planCode; // e.g. TRIAL, STARTER, BUSINESS, PRO
    }

    @Getter
    public static class TokenResponse {
        private final String accessToken;
        private final String refreshToken;
        private final String tokenType = "Bearer";
        private final long expiresIn;
        private final UserInfo user;

        public TokenResponse(String accessToken, String refreshToken, long expiresIn, UserInfo user) {
            this.accessToken = accessToken;
            this.refreshToken = refreshToken;
            this.expiresIn = expiresIn;
            this.user = user;
        }
    }

    @Getter
    public static class UserInfo {
        private final String id;
        private final String username;
        private final String fullName;
        private final String tenantId;
        private final String restaurantCode;
        private final String restaurantName;
        private final String restaurantStatus;
        private final boolean isSuperAdmin;
        private final String role;
        private final String kitchenId;
        private final java.util.List<String> kitchenIds;
        private final java.util.Set<String> permissions;

        public UserInfo(String id, String username, String fullName, String tenantId,
                        String role, String kitchenId, java.util.Set<String> permissions) {
            this(id, username, fullName, tenantId, null, null, null, false, role, kitchenId, 
                 kitchenId != null ? java.util.List.of(kitchenId) : java.util.List.of(), permissions);
        }

        public UserInfo(String id, String username, String fullName, String tenantId,
                        String role, String kitchenId, java.util.List<String> kitchenIds, java.util.Set<String> permissions) {
            this(id, username, fullName, tenantId, null, null, null, false, role, kitchenId, kitchenIds, permissions);
        }

        public UserInfo(String id, String username, String fullName, String tenantId,
                        String restaurantCode, String restaurantName, String restaurantStatus, boolean isSuperAdmin,
                        String role, String kitchenId, java.util.List<String> kitchenIds, java.util.Set<String> permissions) {
            this.id = id;
            this.username = username;
            this.fullName = fullName;
            this.tenantId = tenantId;
            this.restaurantCode = restaurantCode;
            this.restaurantName = restaurantName;
            this.restaurantStatus = restaurantStatus;
            this.isSuperAdmin = isSuperAdmin;
            this.role = role;
            this.kitchenId = kitchenId;
            this.kitchenIds = kitchenIds != null ? kitchenIds : java.util.List.of();
            this.permissions = permissions;
        }
    }
}
