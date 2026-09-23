package com.restaurantpos.devices.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class DeviceBindingDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeviceActivateRequest {
        @NotBlank(message = "Username kiritilishi shart")
        private String username;

        @NotBlank(message = "Parol kiritilishi shart")
        private String password;

        @NotBlank(message = "Installation ID kiritilishi shart")
        private String installationId;

        @NotBlank(message = "Device ID kiritilishi shart")
        private String deviceId;

        private String deviceName;
        private String osInfo;
        private String appVersion;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeviceTenantDto {
        private UUID id;
        private String name;
        private String code;
        private String slug;
        private String logoUrl;
        private String phone;
        private String address;
        private String city;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeviceEmployeeDto {
        private UUID id;
        private String fullName;
        private String firstName;
        private String lastName;
        private String username;
        private String role;
        private String avatar;
        private String phone;
        private String authenticationType;
        private boolean isAdmin;
        private UUID kitchenId;
        private String kitchenName;
        private List<UUID> kitchenIds;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeviceActivateResponse {
        private String installationId;
        private String deviceId;
        private String status;
        private DeviceTenantDto tenant;
        private List<DeviceEmployeeDto> employees;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeviceInfoDto {
        private String installationId;
        private boolean bound;
        private String status;
        private DeviceTenantDto tenant;
        private List<DeviceEmployeeDto> employees;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmployeeLoginRequest {
        @NotBlank(message = "Installation ID kiritilishi shart")
        private String installationId;

        private String deviceId;
        private UUID employeeId;
        private String username;

        @NotBlank(message = "Parol kiritilishi shart")
        private String password;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlatformDeviceResponse {
        private UUID id;
        private String installationId;
        private String deviceId;
        private UUID tenantId;
        private String restaurantName;
        private String restaurantCode;
        private String deviceName;
        private String deviceType;
        private String osInfo;
        private String appVersion;
        private String ipAddress;
        private String status;
        private String lastUserFullName;
        private Instant activatedAt;
        private Instant lastSeenAt;
        private boolean online;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateDeviceStatusRequest {
        @NotBlank(message = "Status kiritilishi shart")
        private String status;
    }
}
