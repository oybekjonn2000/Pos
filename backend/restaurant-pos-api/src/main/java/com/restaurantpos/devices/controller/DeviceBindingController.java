package com.restaurantpos.devices.controller;

import com.restaurantpos.auth.dto.AuthDto;
import com.restaurantpos.common.response.ApiResponse;
import com.restaurantpos.devices.dto.DeviceBindingDto;
import com.restaurantpos.devices.service.DeviceBindingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/device")
@RequiredArgsConstructor
@Tag(name = "Device Binding", description = "Desktop POS Terminal Binding and Employee Login (JOWI POS model)")
public class DeviceBindingController {

    private final DeviceBindingService deviceBindingService;

    @PostMapping("/activate")
    @Operation(summary = "Initial Device Activation: binds the physical installation to the specified restaurant")
    public ResponseEntity<ApiResponse<DeviceBindingDto.DeviceActivateResponse>> activateDevice(
            @Valid @RequestBody DeviceBindingDto.DeviceActivateRequest request) {
        DeviceBindingDto.DeviceActivateResponse res = deviceBindingService.activateDevice(request);
        return ResponseEntity.ok(ApiResponse.success(res, "Qurilma muvaffaqiyatli restoranga biriktirildi"));
    }

    @GetMapping("/info")
    @Operation(summary = "Get Terminal & Restaurant Info and active employee list")
    public ResponseEntity<ApiResponse<DeviceBindingDto.DeviceInfoDto>> getDeviceInfo(
            @RequestParam(required = false) String installationId,
            @RequestHeader(value = "X-Installation-Id", required = false) String headerInstallationId) {
        String instId = installationId != null && !installationId.isBlank()
                ? installationId.trim()
                : (headerInstallationId != null ? headerInstallationId.trim() : "");
        DeviceBindingDto.DeviceInfoDto res = deviceBindingService.getDeviceInfo(instId);
        return ResponseEntity.ok(ApiResponse.success(res));
    }

    @PostMapping("/employee-login")
    @Operation(summary = "Employee Login via bound terminal (PIN or Password)")
    public ResponseEntity<ApiResponse<AuthDto.TokenResponse>> employeeLogin(
            @Valid @RequestBody DeviceBindingDto.EmployeeLoginRequest request) {
        AuthDto.TokenResponse tokenRes = deviceBindingService.employeeLogin(request);
        return ResponseEntity.ok(ApiResponse.success(tokenRes, "Muvaffaqiyatli kirildi"));
    }
}
