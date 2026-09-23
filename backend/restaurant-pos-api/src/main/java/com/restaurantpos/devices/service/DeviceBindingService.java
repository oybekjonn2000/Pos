package com.restaurantpos.devices.service;

import com.restaurantpos.auth.dto.AuthDto;
import com.restaurantpos.auth.service.AuthService;
import com.restaurantpos.common.exception.PosException;
import com.restaurantpos.devices.dto.DeviceBindingDto;
import com.restaurantpos.devices.entity.DeviceInstallation;
import com.restaurantpos.devices.entity.DeviceInstallationStatus;
import com.restaurantpos.devices.repository.DeviceInstallationRepository;
import com.restaurantpos.tenants.entity.Tenant;
import com.restaurantpos.users.entity.User;
import com.restaurantpos.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeviceBindingService {

    private final DeviceInstallationRepository installationRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    /**
     * Initial Device Activation (JOWI POS model).
     * Binds this physical/installation terminal to the specified restaurant account.
     */
    @Transactional
    public DeviceBindingDto.DeviceActivateResponse activateDevice(DeviceBindingDto.DeviceActivateRequest request) {
        String username = request.getUsername() != null ? request.getUsername().trim() : "";
        String installationId = request.getInstallationId() != null ? request.getInstallationId().trim() : "";
        String deviceId = request.getDeviceId() != null ? request.getDeviceId().trim() : "";

        if (installationId.isBlank() || deviceId.isBlank()) {
            throw PosException.badRequest("Installation ID va Device ID kiritilishi shart!");
        }

        // 1. Verify user credentials (must be restaurant admin or manager)
        User user = userRepository.findByUsernameIgnoreCaseAndDeletedAtIsNull(username)
                .orElseThrow(() -> PosException.unauthorized("Login yoki parol noto'g'ri!"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw PosException.unauthorized("Login yoki parol noto'g'ri!");
        }

        Tenant tenant = user.getTenant();
        if (tenant == null) {
            throw PosException.badRequest("Super Admin hisobi orqali ma'lum bir restoranga qurilma biriktirib bo'lmaydi.");
        }

        if (tenant.isSuspended()) {
            throw PosException.forbidden("Ushbu restoran faoliyati to'xtatilgan (SUSPENDED).");
        }
        if (!tenant.isOperating()) {
            throw PosException.forbidden("Ushbu restoran tizimda faol emas (INACTIVE).");
        }

        // 2. CHECK DEVICE BINDING RULES (Requirement 5 & 11)
        // If this installationId is already bound to a DIFFERENT restaurant, reject!
        Optional<DeviceInstallation> existingByInst = installationRepository.findByInstallationId(installationId);
        if (existingByInst.isPresent()) {
            DeviceInstallation bound = existingByInst.get();
            if (!bound.getTenant().getId().equals(tenant.getId())) {
                log.warn("Device installation {} already bound to tenant {} ({}), attempted by tenant {} ({})",
                        installationId, bound.getTenant().getId(), bound.getTenant().getName(),
                        tenant.getId(), tenant.getName());
                throw PosException.badRequest("Bu qurilma boshqa restoran hisobiga biriktirilgan.");
            }
        }

        // If this deviceId is already bound to a DIFFERENT restaurant, reject!
        Optional<DeviceInstallation> existingByDev = installationRepository.findByDeviceId(deviceId);
        if (existingByDev.isPresent()) {
            DeviceInstallation bound = existingByDev.get();
            if (!bound.getTenant().getId().equals(tenant.getId())) {
                log.warn("Device ID {} already bound to tenant {} ({}), attempted by tenant {} ({})",
                        deviceId, bound.getTenant().getId(), bound.getTenant().getName(),
                        tenant.getId(), tenant.getName());
                throw PosException.badRequest("Bu qurilma boshqa restoran hisobiga biriktirilgan.");
            }
        }

        DeviceInstallation installation;
        if (existingByInst.isPresent()) {
            installation = existingByInst.get();
            if (installation.isBlocked()) {
                throw PosException.forbidden("Ushbu qurilma server tomonidan bloklangan.");
            }
            if (installation.isRevoked()) {
                throw PosException.forbidden("Ushbu qurilma biriktiruvi bekor qilingan (REVOKED). Qayta o'rnatish talab qilinadi.");
            }
            installation.setDeviceId(deviceId);
            if (request.getDeviceName() != null && !request.getDeviceName().isBlank()) {
                installation.setDeviceName(request.getDeviceName().trim());
            }
            if (request.getOsInfo() != null) installation.setOsInfo(request.getOsInfo());
            if (request.getAppVersion() != null) installation.setAppVersion(request.getAppVersion());
            installation.setLastSeenAt(Instant.now());
            installation.setLastUser(user);
        } else {
            installation = new DeviceInstallation();
            installation.setInstallationId(installationId);
            installation.setDeviceId(deviceId);
            installation.setTenant(tenant);
            installation.setDeviceName(request.getDeviceName() != null && !request.getDeviceName().isBlank()
                    ? request.getDeviceName().trim() : "Desktop POS (" + tenant.getCode() + ")");
            installation.setOsInfo(request.getOsInfo());
            installation.setAppVersion(request.getAppVersion());
            installation.setStatus(DeviceInstallationStatus.ACTIVE);
            installation.setLastUser(user);
            installation.setActivatedAt(Instant.now());
            installation.setLastSeenAt(Instant.now());
        }

        DeviceInstallation saved = installationRepository.save(installation);
        log.info("Terminal successfully activated: installationId={}, tenant={}", installationId, tenant.getCode());

        List<DeviceBindingDto.DeviceEmployeeDto> employees = getActiveEmployees(tenant.getId());

        return DeviceBindingDto.DeviceActivateResponse.builder()
                .installationId(saved.getInstallationId())
                .deviceId(saved.getDeviceId())
                .status(saved.getStatus().name())
                .tenant(mapTenantDto(tenant))
                .employees(employees)
                .build();
    }

    /**
     * Get Device Info and active employees for bound terminal.
     */
    @Transactional(readOnly = true)
    public DeviceBindingDto.DeviceInfoDto getDeviceInfo(String installationId) {
        if (installationId == null || installationId.isBlank()) {
            return DeviceBindingDto.DeviceInfoDto.builder().installationId("").bound(false).build();
        }

        Optional<DeviceInstallation> opt = installationRepository.findByInstallationId(installationId.trim());
        if (opt.isEmpty()) {
            return DeviceBindingDto.DeviceInfoDto.builder()
                    .installationId(installationId)
                    .bound(false)
                    .build();
        }

        DeviceInstallation inst = opt.get();
        Tenant tenant = inst.getTenant();

        List<DeviceBindingDto.DeviceEmployeeDto> employees = inst.isActive() && tenant.isOperating()
                ? getActiveEmployees(tenant.getId())
                : List.of();

        return DeviceBindingDto.DeviceInfoDto.builder()
                .installationId(inst.getInstallationId())
                .bound(true)
                .status(inst.getStatus().name())
                .tenant(mapTenantDto(tenant))
                .employees(employees)
                .build();
    }

    /**
     * Employee Login via bound terminal (PIN or Password).
     */
    @Transactional
    public AuthDto.TokenResponse employeeLogin(DeviceBindingDto.EmployeeLoginRequest request) {
        String installationId = request.getInstallationId() != null ? request.getInstallationId().trim() : "";
        if (installationId.isBlank()) {
            throw PosException.badRequest("Installation ID kiritilishi shart!");
        }

        DeviceInstallation installation = installationRepository.findByInstallationId(installationId)
                .orElseThrow(() -> PosException.badRequest("Qurilma biriktirilmagan. Iltimos, avval restoran hisobiga kiring."));

        if (installation.isBlocked()) {
            throw PosException.forbidden("Ushbu qurilma server tomonidan bloklangan.");
        }
        if (installation.isRevoked()) {
            throw PosException.forbidden("Ushbu qurilma biriktiruvi bekor qilingan (REVOKED).");
        }

        Tenant tenant = installation.getTenant();
        if (tenant.isSuspended()) {
            throw PosException.forbidden("Ushbu restoran faoliyati to'xtatilgan (SUSPENDED).");
        }
        if (!tenant.isOperating()) {
            throw PosException.forbidden("Ushbu restoran tizimda faol emas (INACTIVE).");
        }

        // Find employee within this tenant
        User employee = null;
        if (request.getEmployeeId() != null) {
            employee = userRepository.findByIdAndTenantIdAndDeletedAtIsNull(request.getEmployeeId(), tenant.getId())
                    .orElse(null);
        }
        if (employee == null && request.getUsername() != null && !request.getUsername().isBlank()) {
            employee = userRepository.findByTenantIdAndUsernameIgnoreCaseAndDeletedAtIsNull(tenant.getId(), request.getUsername().trim())
                    .orElse(null);
        }

        if (employee == null || !employee.isActive()) {
            throw PosException.unauthorized("Parol noto'g'ri.");
        }

        // Verify password or PIN according to authenticationType
        String rawPassword = request.getPassword() != null ? request.getPassword() : "";
        boolean isPinOnly = employee.isPinOnly();
        boolean authenticated = false;

        if (isPinOnly) {
            // Ordinary staff: ONLY PIN matches
            authenticated = employee.getPinHash() != null && passwordEncoder.matches(rawPassword, employee.getPinHash());
        } else {
            // Admin: can login via either password or PIN
            boolean passwordMatches = employee.getPasswordHash() != null && passwordEncoder.matches(rawPassword, employee.getPasswordHash());
            boolean pinMatches = employee.getPinHash() != null && passwordEncoder.matches(rawPassword, employee.getPinHash());
            authenticated = passwordMatches || pinMatches;
        }

        if (!authenticated) {
            employee.incrementFailedAttempts();
            userRepository.save(employee);
            throw PosException.unauthorized("Parol noto'g'ri.");
        }

        employee.resetFailedAttempts();
        employee.setLastLoginAt(Instant.now());
        userRepository.save(employee);

        installation.setLastSeenAt(Instant.now());
        installation.setLastUser(employee);
        installationRepository.save(installation);

        return authService.issueTokensForUser(employee);
    }

    /**
     * Super Admin: Get all devices across platform.
     */
    @Transactional(readOnly = true)
    public List<DeviceBindingDto.PlatformDeviceResponse> getAllDevices() {
        List<DeviceInstallation> list = installationRepository.findAllWithTenantAndLastUser();
        Instant now = Instant.now();

        return list.stream().map(d -> {
            boolean isOnline = d.getLastSeenAt() != null && Duration.between(d.getLastSeenAt(), now).toMinutes() <= 5;
            String userFull = d.getLastUser() != null ? d.getLastUser().getFullName() : "—";
            return DeviceBindingDto.PlatformDeviceResponse.builder()
                    .id(d.getId())
                    .installationId(d.getInstallationId())
                    .deviceId(d.getDeviceId())
                    .tenantId(d.getTenant().getId())
                    .restaurantName(d.getTenant().getName())
                    .restaurantCode(d.getTenant().getCode())
                    .deviceName(d.getDeviceName())
                    .deviceType(d.getDeviceType())
                    .osInfo(d.getOsInfo())
                    .appVersion(d.getAppVersion())
                    .ipAddress(d.getIpAddress())
                    .status(d.getStatus().name())
                    .lastUserFullName(userFull)
                    .activatedAt(d.getActivatedAt())
                    .lastSeenAt(d.getLastSeenAt())
                    .online(isOnline)
                    .build();
        }).collect(Collectors.toList());
    }

    /**
     * Super Admin: Update status (ACTIVE, BLOCKED, REVOKED).
     */
    @Transactional
    public DeviceBindingDto.PlatformDeviceResponse updateDeviceStatus(UUID id, DeviceInstallationStatus status) {
        DeviceInstallation d = installationRepository.findById(id)
                .orElseThrow(() -> PosException.notFound("Qurilma topilmadi: " + id));
        d.setStatus(status);
        DeviceInstallation saved = installationRepository.save(d);

        boolean isOnline = saved.getLastSeenAt() != null && Duration.between(saved.getLastSeenAt(), Instant.now()).toMinutes() <= 5;
        String userFull = saved.getLastUser() != null ? saved.getLastUser().getFullName() : "—";

        return DeviceBindingDto.PlatformDeviceResponse.builder()
                .id(saved.getId())
                .installationId(saved.getInstallationId())
                .deviceId(saved.getDeviceId())
                .tenantId(saved.getTenant().getId())
                .restaurantName(saved.getTenant().getName())
                .restaurantCode(saved.getTenant().getCode())
                .deviceName(saved.getDeviceName())
                .deviceType(saved.getDeviceType())
                .osInfo(saved.getOsInfo())
                .appVersion(saved.getAppVersion())
                .ipAddress(saved.getIpAddress())
                .status(saved.getStatus().name())
                .lastUserFullName(userFull)
                .activatedAt(saved.getActivatedAt())
                .lastSeenAt(saved.getLastSeenAt())
                .online(isOnline)
                .build();
    }

    /**
     * Super Admin: Unbind device.
     */
    @Transactional
    public void unbindDevice(UUID id) {
        DeviceInstallation d = installationRepository.findById(id)
                .orElseThrow(() -> PosException.notFound("Qurilma topilmadi: " + id));
        installationRepository.delete(d);
        log.info("Device unbind completed: id={}, installationId={}", id, d.getInstallationId());
    }

    private List<DeviceBindingDto.DeviceEmployeeDto> getActiveEmployees(UUID tenantId) {
        List<User> users = userRepository.findByTenantIdAndDeletedAtIsNullOrderByCreatedAtDesc(tenantId);
        return users.stream()
                .filter(User::isActive)
                .map(u -> {
                    String role = u.getRoles().isEmpty() ? "STAFF" : u.getRoles().iterator().next().getName();
                    UUID kitchenId = u.getKitchen() != null ? u.getKitchen().getId() : null;
                    String kitchenName = u.getKitchen() != null ? u.getKitchen().getName() : null;
                    List<UUID> kIds = u.getKitchens() != null
                            ? u.getKitchens().stream().map(com.restaurantpos.kitchen.entity.Kitchen::getId).collect(Collectors.toList())
                            : List.of();

                    boolean isAdmin = u.isAdmin();
                    String authType = u.getAuthenticationType() != null
                            ? u.getAuthenticationType().name()
                            : (isAdmin ? "PASSWORD_AND_PIN" : "PIN_ONLY");

                    return DeviceBindingDto.DeviceEmployeeDto.builder()
                            .id(u.getId())
                            .fullName(u.getFullName())
                            .firstName(u.getFirstName())
                            .lastName(u.getLastName())
                            .username(u.getUsername())
                            .role(role)
                            .phone(u.getPhone())
                            .authenticationType(authType)
                            .isAdmin(isAdmin)
                            .kitchenId(kitchenId)
                            .kitchenName(kitchenName)
                            .kitchenIds(kIds)
                            .build();
                })
                .collect(Collectors.toList());
    }

    private DeviceBindingDto.DeviceTenantDto mapTenantDto(Tenant tenant) {
        return DeviceBindingDto.DeviceTenantDto.builder()
                .id(tenant.getId())
                .name(tenant.getName())
                .code(tenant.getCode())
                .slug(tenant.getSlug())
                .logoUrl(tenant.getLogoUrl())
                .phone(tenant.getPhone())
                .address(tenant.getAddress())
                .city(tenant.getCity())
                .build();
    }
}
