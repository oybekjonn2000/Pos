package com.restaurantpos.users.service;

import com.restaurantpos.common.exception.PosException;
import com.restaurantpos.tenants.entity.Tenant;
import com.restaurantpos.tenants.repository.TenantRepository;
import com.restaurantpos.users.dto.UserDto;
import com.restaurantpos.kitchen.entity.Kitchen;
import com.restaurantpos.users.entity.EmployeeKitchen;
import com.restaurantpos.users.entity.Role;
import com.restaurantpos.users.entity.User;
import com.restaurantpos.users.repository.RoleRepository;
import com.restaurantpos.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final TenantRepository tenantRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.restaurantpos.kitchen.repository.KitchenRepository kitchenRepository;
    private final com.restaurantpos.billing.service.SubscriptionLimitService subscriptionLimitService;

    @Transactional(readOnly = true)
    public List<UserDto.Response> getAllUsers(UUID tenantId) {
        return userRepository.findAllByTenantId(tenantId, PageRequest.of(0, 1000))
                .getContent()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<UserDto.Response> getUsersPaginated(UUID tenantId, org.springframework.data.domain.Pageable pageable) {
        return userRepository.findByTenantIdAndDeletedAtIsNull(tenantId, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public UserDto.Response getUserById(UUID id, UUID tenantId) {
        User user = userRepository.findByIdAndDeletedAtIsNull(id)
                .filter(u -> u.getTenant().getId().equals(tenantId))
                .orElseThrow(() -> PosException.notFound("User not found with id: " + id));
        return mapToResponse(user);
    }

    public static String computePinLookupHash(UUID tenantId, String rawPin) {
        if (rawPin == null || rawPin.isBlank()) return null;
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
            String salt = tenantId != null ? tenantId.toString() : "PLATFORM_SUPERADMIN";
            byte[] hash = md.digest((salt + ":" + rawPin.trim()).getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to compute PIN lookup hash", e);
        }
    }

    public static void validatePinFormat(String pin) {
        if (pin == null || !pin.trim().matches("^[0-9]{1,4}$")) {
            throw PosException.badRequest("PIN kod 1 tadan 4 tagacha raqamdan iborat bo'lishi kerak.");
        }
    }

    @Transactional(readOnly = true)
    public UserDto.Response getUserProfile(UUID userId) {
        User user = userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> PosException.notFound("Foydalanuvchi topilmadi."));
        return mapToResponse(user);
    }

    @Transactional
    public UserDto.Response updateProfile(UUID userId, UserDto.ProfileUpdateRequest request) {
        User user = userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> PosException.notFound("Foydalanuvchi topilmadi."));

        if (request.getFirstName() == null || request.getFirstName().trim().isBlank()) {
            throw PosException.badRequest("Ism kiritilishi shart.");
        }
        if (request.getPhone() == null || request.getPhone().trim().isBlank()) {
            throw PosException.badRequest("Telefon raqami kiritilishi shart.");
        }

        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName() != null ? request.getLastName().trim() : "");
        user.setPhone(request.getPhone().trim());

        // Email validation & update
        if (request.getEmail() != null && !request.getEmail().trim().isBlank()) {
            String newEmail = request.getEmail().trim().toLowerCase();
            if (user.getEmail() == null || !newEmail.equalsIgnoreCase(user.getEmail().trim())) {
                if (userRepository.existsByEmailIgnoreCaseAndIdNotAndDeletedAtIsNull(newEmail, userId)) {
                    throw PosException.badRequest("Ushbu email manzili allaqachon boshqa foydalanuvchi tomonidan band qilingan.");
                }
                user.setEmail(newEmail);
            }
        }

        boolean hasPasswordUpdate = request.getNewPassword() != null && !request.getNewPassword().trim().isBlank();
        boolean hasPinUpdate = request.getNewPin() != null && !request.getNewPin().trim().isBlank();

        boolean isSuperAdmin = user.getTenant() == null || (user.getRoles() != null && user.getRoles().stream().anyMatch(r -> "SUPER_ADMIN".equalsIgnoreCase(r.getName())));
        if (isSuperAdmin) {
            hasPinUpdate = false; // Superadmin does not need or use PIN code
        }

        // If password or PIN is being updated, verify current password if present
        if (hasPasswordUpdate || hasPinUpdate) {
            if (user.getPasswordHash() != null && !user.getPasswordHash().isBlank()) {
                if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()) {
                    throw PosException.badRequest("Parol" + (hasPinUpdate ? " yoki PIN kodni" : "") + " o'zgartirish uchun joriy parolingizni kiriting.");
                }
                if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
                    throw PosException.badRequest("Joriy parol noto'g'ri kiritildi.");
                }
            } else if (user.getPinHash() != null && !user.getPinHash().isBlank()) {
                if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()) {
                    throw PosException.badRequest("PIN kodni o'zgartirish uchun joriy PIN kod yoki parolni kiriting.");
                }
                boolean matchesPin = passwordEncoder.matches(request.getCurrentPassword(), user.getPinHash());
                if (!matchesPin) {
                    throw PosException.badRequest("Joriy PIN kod noto'g'ri kiritildi.");
                }
            }
        }

        // Apply new password
        if (hasPasswordUpdate) {
            String newPass = request.getNewPassword().trim();
            if (newPass.length() < 4) {
                throw PosException.badRequest("Yangi parol kamida 4 ta belgidan iborat bo'lishi kerak.");
            }
            user.setPasswordHash(passwordEncoder.encode(newPass));
        }

        // Apply new PIN
        if (hasPinUpdate) {
            String newPin = request.getNewPin().trim();
            validatePinFormat(newPin);
            user.setPinHash(passwordEncoder.encode(newPin));
            UUID tenantId = user.getTenant() != null ? user.getTenant().getId() : null;
            user.setPinLookupHash(computePinLookupHash(tenantId, newPin));
        }

        User saved = userRepository.save(user);
        log.info("Profile updated for user: {} (ID: {})", saved.getFullName(), saved.getId());
        return mapToResponse(saved);
    }

    @Transactional
    public UserDto.Response createUser(UUID tenantId, UserDto.CreateRequest request) {
        subscriptionLimitService.checkUserLimit(tenantId);

        if (request.getPhone() == null || request.getPhone().trim().isBlank()) {
            throw PosException.badRequest("Telefon raqami kiritilishi shart.");
        }

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> PosException.notFound("Tenant not found with id: " + tenantId));

        Set<Role> roles = new HashSet<>();
        if (request.getRoleId() != null) {
            roleRepository.findByIdAndDeletedAtIsNull(request.getRoleId()).ifPresent(roles::add);
        } else if (request.getRole() != null && !request.getRole().isBlank()) {
            roleRepository.findByNameAndTenantIdAndDeletedAtIsNull(request.getRole().toUpperCase(), tenantId)
                    .ifPresent(roles::add);
        }

        String createRoleName = roles.isEmpty() ? (request.getRole() != null ? request.getRole().toUpperCase() : "STAFF") : roles.iterator().next().getName();
        boolean isAdmin = "ADMIN".equalsIgnoreCase(createRoleName) || "SUPER_ADMIN".equalsIgnoreCase(createRoleName);

        User user = new User();
        user.setTenant(tenant);
        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName() != null ? request.getLastName().trim() : "");
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone().trim());
        user.setActive(true);
        user.setRoles(roles);

        if (isAdmin) {
            // Admin requires username, password, and unique PIN
            if (request.getUsername() == null || request.getUsername().trim().isBlank()) {
                throw PosException.badRequest("Admin uchun username kiritilishi shart.");
            }
            if (userRepository.existsByUsernameIgnoreCaseAndDeletedAtIsNull(request.getUsername().trim())) {
                throw PosException.badRequest("Bu username login bazasida mavjud. Boshqa username tanlang.");
            }
            if (request.getPassword() == null || request.getPassword().length() < 4) {
                throw PosException.badRequest("Admin uchun parol kamida 4 belgidan iborat bo'lishi kerak.");
            }
            if (request.getPin() == null || request.getPin().trim().isBlank()) {
                throw PosException.badRequest("Admin uchun PIN kod kiritilishi shart.");
            }
            validatePinFormat(request.getPin());

            user.setUsername(request.getUsername().trim().toLowerCase());
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
            user.setPinHash(passwordEncoder.encode(request.getPin().trim()));
            user.setPinLookupHash(computePinLookupHash(tenantId, request.getPin()));
            user.setAuthenticationType(com.restaurantpos.users.entity.AuthenticationType.PASSWORD_AND_PIN);
        } else {
            // Ordinary staff: NO username, NO password, PIN is required
            user.setUsername(null);
            user.setPasswordHash(null);
            user.setAuthenticationType(com.restaurantpos.users.entity.AuthenticationType.PIN_ONLY);

            if (request.getPin() == null || request.getPin().trim().isBlank()) {
                throw PosException.badRequest("Xodim uchun PIN kod kiritilishi shart.");
            }
            validatePinFormat(request.getPin());

            user.setPinHash(passwordEncoder.encode(request.getPin().trim()));
            user.setPinLookupHash(computePinLookupHash(tenantId, request.getPin()));
        }

        User saved = userRepository.save(user);
        log.info("User created: {} with role {} and id {}", saved.getFullName(), createRoleName, saved.getId());
        return mapToResponse(saved);
    }

    @Transactional
    public UserDto.Response updateUser(UUID id, UUID tenantId, UserDto.UpdateRequest request) {
        User user = userRepository.findByIdAndDeletedAtIsNull(id)
                .filter(u -> u.getTenant().getId().equals(tenantId))
                .orElseThrow(() -> PosException.notFound("User not found with id: " + id));

        user.setFirstName(request.getFirstName().trim());
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName().trim());
        }
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            user.setPhone(request.getPhone().trim());
        }
        if (request.getActive() != null) {
            user.setActive(request.getActive());
        }

        if (request.getPin() != null && !request.getPin().isBlank()) {
            validatePinFormat(request.getPin());
            user.setPinHash(passwordEncoder.encode(request.getPin().trim()));
            user.setPinLookupHash(computePinLookupHash(tenantId, request.getPin()));
        }

        if (request.getRoleId() != null) {
            Set<Role> roles = new HashSet<>();
            roleRepository.findByIdAndDeletedAtIsNull(request.getRoleId()).ifPresent(roles::add);
            user.setRoles(roles);
        } else if (request.getRole() != null && !request.getRole().isBlank()) {
            Set<Role> roles = new HashSet<>();
            roleRepository.findByNameAndTenantIdAndDeletedAtIsNull(request.getRole().toUpperCase(), tenantId)
                    .ifPresent(roles::add);
            user.setRoles(roles);
        }

        String editRoleName = user.getRoles().isEmpty() ? (request.getRole() != null ? request.getRole().toUpperCase() : "STAFF") : user.getRoles().iterator().next().getName();
        boolean isEditKitchenRole = "KITCHEN".equalsIgnoreCase(editRoleName) ||
                (editRoleName != null && (editRoleName.contains("KITCHEN") || editRoleName.contains("OSHPAZ")));

        if (request.getRole() != null || request.getRoleId() != null) {
            if (!isEditKitchenRole) {
                user.getEmployeeKitchens().clear();
                user.setKitchen(null);
            }
        }

        User updated = userRepository.save(user);
        log.info("User updated: {}", updated.getUsername());
        return mapToResponse(updated);
    }

    @Transactional
    public void deactivateUser(UUID id, UUID tenantId) {
        User user = userRepository.findByIdAndDeletedAtIsNull(id)
                .filter(u -> u.getTenant().getId().equals(tenantId))
                .orElseThrow(() -> PosException.notFound("User not found with id: " + id));

        user.setActive(!user.isActive());
        userRepository.save(user);
        log.info("User active status toggled for: {}", user.getUsername());
    }

    @Transactional
    public void resetPassword(UUID id, UUID tenantId, String newPassword) {
        User user = userRepository.findByIdAndDeletedAtIsNull(id)
                .filter(u -> u.getTenant().getId().equals(tenantId))
                .orElseThrow(() -> PosException.notFound("User not found with id: " + id));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        log.info("Password reset for user: {}", user.getUsername());
    }

    @Transactional(readOnly = true)
    public List<UserDto.RoleResponse> getRoles(UUID tenantId) {
        return roleRepository.findAllByTenantIdAndDeletedAtIsNull(tenantId)
                .stream()
                .map(r -> UserDto.RoleResponse.builder()
                        .id(r.getId())
                        .name(r.getName())
                        .description(r.getDescription())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void changeAdminPin(UUID userId, UUID tenantId, UserDto.ChangePinRequest request) {
        User user = userRepository.findByIdAndTenantIdAndDeletedAtIsNull(userId, tenantId)
                .orElseThrow(() -> PosException.notFound("Foydalanuvchi topilmadi."));

        if (request.getNewPin() == null || request.getNewPin().trim().isBlank()) {
            throw PosException.badRequest("Yangi PIN kod kiritilishi shart.");
        }
        if (request.getConfirmPin() == null || !request.getNewPin().trim().equals(request.getConfirmPin().trim())) {
            throw PosException.badRequest("Yangi PIN kod va uning tasdig'i bir xil bo'lishi kerak.");
        }

        validatePinFormat(request.getNewPin().trim());

        if (request.getCurrentPinOrPassword() != null && !request.getCurrentPinOrPassword().isBlank()) {
            boolean currentPinMatch = user.getPinHash() != null && passwordEncoder.matches(request.getCurrentPinOrPassword(), user.getPinHash());
            boolean currentPassMatch = user.getPasswordHash() != null && passwordEncoder.matches(request.getCurrentPinOrPassword(), user.getPasswordHash());
            if (!currentPinMatch && !currentPassMatch) {
                throw PosException.badRequest("Eski PIN kod yoki parol noto'g'ri.");
            }
        }

        String lookupHash = computePinLookupHash(tenantId, request.getNewPin().trim());

        user.setPinHash(passwordEncoder.encode(request.getNewPin().trim()));
        user.setPinLookupHash(lookupHash);
        userRepository.save(user);
        log.info("Admin PIN updated successfully for user: {}", user.getId());
    }

    public UserDto.Response mapToResponse(User user) {
        String roleName = user.getRoles().isEmpty() ? "STAFF" : user.getRoles().iterator().next().getName();
        UUID roleId = user.getRoles().isEmpty() ? null : user.getRoles().iterator().next().getId();
        String fullName = (user.getFirstName() + " " + (user.getLastName() != null ? user.getLastName() : "")).trim();

        List<String> permissions = user.getRoles().stream()
                .flatMap(r -> r.getPermissions().stream())
                .map(p -> p.getCode())
                .distinct()
                .collect(Collectors.toList());

        List<UUID> kitchenIds = user.getEmployeeKitchens() != null
                ? user.getEmployeeKitchens().stream()
                .map(ek -> ek.getKitchen().getId())
                .collect(Collectors.toList())
                : new ArrayList<>();

        List<UserDto.KitchenSummary> kitchens = user.getEmployeeKitchens() != null
                ? user.getEmployeeKitchens().stream()
                .map(ek -> UserDto.KitchenSummary.builder()
                        .id(ek.getKitchen().getId())
                        .name(ek.getKitchen().getName())
                        .code(ek.getKitchen().getCode())
                        .build())
                .collect(Collectors.toList())
                : new ArrayList<>();

        if (kitchenIds.isEmpty() && user.getKitchen() != null) {
            kitchenIds = List.of(user.getKitchen().getId());
            kitchens = List.of(UserDto.KitchenSummary.builder()
                    .id(user.getKitchen().getId())
                    .name(user.getKitchen().getName())
                    .code(user.getKitchen().getCode())
                    .build());
        }

        UUID singleKitchenId = user.getKitchen() != null ? user.getKitchen().getId() : null;
        String singleKitchenName = user.getKitchen() != null ? user.getKitchen().getName() : null;
        String singleKitchenCode = user.getKitchen() != null ? user.getKitchen().getCode() : null;

        return UserDto.Response.builder()
                .id(user.getId())
                .username(user.getUsername())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(fullName)
                .email(user.getEmail())
                .phone(user.getPhone())
                .active(user.isActive())
                .role(roleName)
                .roleId(roleId)
                .authenticationType(user.getAuthenticationType() != null ? user.getAuthenticationType().name() : "PIN_ONLY")
                .hasPin(user.getPinHash() != null)
                .permissions(permissions)
                .kitchenId(singleKitchenId)
                .kitchenName(singleKitchenName)
                .kitchenCode(singleKitchenCode)
                .kitchenIds(kitchenIds)
                .kitchens(kitchens)
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
