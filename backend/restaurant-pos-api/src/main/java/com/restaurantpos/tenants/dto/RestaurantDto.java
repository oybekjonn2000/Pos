package com.restaurantpos.tenants.dto;

import com.restaurantpos.tenants.entity.RestaurantStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

public class RestaurantDto {

    @Getter
    @Setter
    public static class CreateRequest {
        @NotBlank(message = "Restoran nomi majburiy")
        @Size(max = 255)
        private String name;

        @NotBlank(message = "Restoran kodi majburiy (masalan: REST001)")
        @Pattern(regexp = "^[A-Za-z0-9_-]{3,50}$", message = "Restoran kodi 3-50 ta harf yoki raqamdan iborat bo'lishi kerak")
        private String code;

        private String slug;
        private String phone;
        private String email;
        private String address;
        private String city;
        private String inn;
        private String currency = "UZS";
        private String timezone = "Asia/Tashkent";
    }

    @Getter
    @Setter
    public static class UpdateRequest {
        @NotBlank(message = "Restoran nomi majburiy")
        private String name;

        private String phone;
        private String email;
        private String address;
        private String city;
        private String inn;
        private String logoUrl;
    }

    @Getter
    @Setter
    public static class StatusUpdateRequest {
        @NotBlank(message = "Status majburiy (ACTIVE, SUSPENDED, INACTIVE)")
        private String status;
    }

    @Getter
    @Setter
    public static class CreateAdminRequest {
        @NotBlank(message = "Username majburiy")
        @Size(min = 3, max = 50)
        private String username;

        @NotBlank(message = "Parol majburiy")
        @Size(min = 6, max = 100)
        private String password;

        @NotBlank(message = "Ism majburiy")
        private String firstName;

        private String lastName;
        private String phone;
        private String email;
    }

    @Getter
    @Builder
    public static class Response {
        private UUID id;
        private String name;
        private String code;
        private String slug;
        private String phone;
        private String email;
        private String address;
        private String city;
        private String inn;
        private String status;
        private boolean active;
        private Instant createdAt;
        private long userCount;
        private long tableCount;
        private long orderCount;
    }
}
