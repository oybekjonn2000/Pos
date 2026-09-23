package com.restaurantpos.auth.service;

import com.restaurantpos.auth.dto.AuthDto;
import com.restaurantpos.auth.security.JwtTokenProvider;
import com.restaurantpos.auth.security.UserPrincipal;
import com.restaurantpos.common.exception.PosException;
import com.restaurantpos.tenants.entity.Tenant;
import com.restaurantpos.users.entity.User;
import com.restaurantpos.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Multi-Tenant aware authentication service handling login, token refresh, and credentials.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.restaurantpos.tenants.repository.TenantRepository tenantRepository;
    private final com.restaurantpos.users.repository.RoleRepository roleRepository;
    private final com.restaurantpos.billing.service.SubscriptionService subscriptionService;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Transactional
    public AuthDto.TokenResponse login(AuthDto.LoginRequest request) {
        String username = request.getUsername() != null ? request.getUsername().trim() : "";
        String restaurantCode = request.getRestaurantCode() != null ? request.getRestaurantCode().trim() : null;

        User user;

        if (restaurantCode != null && !restaurantCode.isBlank()) {
            // Explicit restaurant-targeted login
            user = userRepository.findByRestaurantCodeAndUsername(restaurantCode, username)
                    .orElseThrow(() -> PosException.unauthorized("Ushbu restoran kodiga ('" + restaurantCode + "') tegishli foydalanuvchi topilmadi!"));
        } else {
            // First check platform-level superadmin (tenant_id IS NULL)
            var superAdminOpt = userRepository.findByUsernameAndTenantIsNullAndDeletedAtIsNull(username);
            if (superAdminOpt.isPresent()) {
                user = superAdminOpt.get();
            } else {
                List<User> matchingUsers = userRepository.findAllByUsername(username);
                if (matchingUsers.isEmpty()) {
                    throw PosException.unauthorized("Login yoki parol noto'g'ri!");
                } else if (matchingUsers.size() > 1) {
                    throw PosException.badRequest("Ushbu login bir nechta restoranda mavjud. Iltimos, restoran kodini ham kiriting!");
                } else {
                    user = matchingUsers.get(0);
                }
            }
        }

        if (!user.isActive()) {
            throw PosException.unauthorized("Foydalanuvchi akkaunti faol emas!");
        }

        if (user.isLocked()) {
            throw PosException.unauthorized("Akkaunt vaqtincha bloklangan. Keyinroq qayta urinib ko'ring.");
        }

        // Validate Tenant / Restaurant lifecycle status
        if (user.getTenant() != null) {
            Tenant tenant = user.getTenant();
            if (tenant.isSuspended()) {
                throw PosException.forbidden("Ushbu restoran faoliyati to'xtatilgan (SUSPENDED). Iltimos, administratorga murojaat qiling!");
            }
            if (!tenant.isOperating()) {
                throw PosException.forbidden("Ushbu restoran tizimda faol emas (INACTIVE).");
            }
        }

        // Verify password hash
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            user.incrementFailedAttempts();
            userRepository.save(user);
            log.warn("Failed login attempt for user: {} (restaurantCode: {})", username, restaurantCode);
            throw PosException.unauthorized("Login yoki parol noto'g'ri!");
        }

        user.resetFailedAttempts();
        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        UserPrincipal principal = buildPrincipal(user);
        return buildTokenResponse(principal, user.getTenant());
    }

    @Transactional
    public AuthDto.TokenResponse refreshToken(AuthDto.RefreshTokenRequest request) {
        String token = request.getRefreshToken();
        if (!jwtTokenProvider.validateToken(token)) {
            throw PosException.unauthorized("Invalid or expired refresh token");
        }

        var userId = jwtTokenProvider.getUserIdFromToken(token);
        User user = userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> PosException.unauthorized("User not found"));

        if (!user.isActive()) {
            throw PosException.unauthorized("Account is inactive");
        }

        if (user.getTenant() != null) {
            Tenant tenant = user.getTenant();
            if (tenant.isSuspended()) {
                throw PosException.forbidden("Restoran faoliyati to'xtatilgan!");
            }
        }

        UserPrincipal principal = buildPrincipal(user);
        return buildTokenResponse(principal, user.getTenant());
    }

    @Transactional
    public AuthDto.TokenResponse register(AuthDto.RegisterRequest request) {
        String restName = request.getRestaurantName().trim();
        String code = (request.getRestaurantCode() != null && !request.getRestaurantCode().isBlank())
                ? request.getRestaurantCode().trim().toUpperCase(java.util.Locale.ROOT)
                : generateUniqueCode(restName);

        if (tenantRepository.existsByCodeIgnoreCase(code)) {
            throw PosException.badRequest("Ushbu restoran kodi ('" + code + "') allaqachon band! Boshqa kod kiriting.");
        }

        String slug = code.toLowerCase(java.util.Locale.ROOT);
        if (tenantRepository.existsBySlug(slug)) {
            slug = slug + "-" + UUID.randomUUID().toString().substring(0, 4);
        }

        if (request.getConfirmPassword() != null && !request.getConfirmPassword().isBlank()) {
            if (!request.getPassword().equals(request.getConfirmPassword())) {
                throw PosException.badRequest("Kiritilgan parollar bir-biriga mos kelmadi!");
            }
        }

        // Pre-validate username uniqueness across the entire system (case-insensitive)
        String username = (request.getUsername() != null && !request.getUsername().isBlank())
                ? request.getUsername().trim().toLowerCase(java.util.Locale.ROOT)
                : request.getPhone().replaceAll("[^0-9]", "");
        if (username.isBlank()) {
            username = "admin_" + code.toLowerCase(java.util.Locale.ROOT);
        }

        if (userRepository.existsByUsernameIgnoreCaseAndDeletedAtIsNull(username)) {
            throw PosException.badRequest("Bu username login bazasida mavjud. Boshqa username tanlang.");
        }

        // 1. Create Tenant entity
        Tenant tenant = new Tenant();
        tenant.setName(restName);
        tenant.setCode(code);
        tenant.setSlug(slug);
        String restPhone = (request.getRestaurantPhone() != null && !request.getRestaurantPhone().isBlank())
                ? request.getRestaurantPhone().trim()
                : request.getPhone();
        tenant.setPhone(restPhone);
        if (request.getLogoUrl() != null && !request.getLogoUrl().isBlank()) {
            tenant.setLogoUrl(request.getLogoUrl().trim());
        }
        tenant.setEmail(request.getEmail());
        tenant.setAddress(request.getAddress());
        tenant.setCity(request.getCity());
        tenant.setInn(request.getInn());
        tenant.setCurrency("UZS");
        tenant.setTimezone("Asia/Tashkent");
        tenant.setStatus(com.restaurantpos.tenants.entity.RestaurantStatus.ACTIVE);
        tenant.setActive(true);
        Tenant savedTenant = tenantRepository.save(tenant);

        // 2. Provision default roles & starting table zone
        provisionDefaultRolesAndZone(savedTenant);

        // 3. Create initial 14-day trial or plan subscription
        subscriptionService.createInitialSubscription(savedTenant, request.getPlanCode());

        // 4. Create owner user
        if (userRepository.existsByUsernameIgnoreCaseAndDeletedAtIsNull(username)) {
            throw PosException.badRequest("Bu username login bazasida mavjud. Boshqa username tanlang.");
        }

        String firstName = request.getFirstName() != null ? request.getFirstName().trim() : "";
        String lastName = request.getLastName() != null ? request.getLastName().trim() : "";
        if (firstName.isBlank() && request.getOwnerName() != null && !request.getOwnerName().isBlank()) {
            String fullName = request.getOwnerName().trim();
            int spaceIdx = fullName.indexOf(' ');
            if (spaceIdx > 0) {
                firstName = fullName.substring(0, spaceIdx);
                lastName = fullName.substring(spaceIdx + 1);
            } else {
                firstName = fullName;
            }
        }
        if (firstName.isBlank()) {
            firstName = "Admin";
        }

        com.restaurantpos.users.entity.Role adminRole = roleRepository.findByNameAndTenantIdAndDeletedAtIsNull("ADMIN", savedTenant.getId())
                .or(() -> roleRepository.findByNameAndTenantIdAndDeletedAtIsNull("RESTAURANT_ADMIN", savedTenant.getId()))
                .orElseGet(() -> {
                    com.restaurantpos.users.entity.Role r = new com.restaurantpos.users.entity.Role();
                    r.setTenant(savedTenant);
                    r.setName("ADMIN");
                    r.setDescription("Restoran Bosh Admini");
                    r.setSystem(true);
                    r.setActive(true);
                    return roleRepository.save(r);
                });

        User user = new User();
        user.setTenant(savedTenant);
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setPhone(request.getPhone());
        user.setEmail(request.getEmail());
        user.setActive(true);
        user.setAuthenticationType(com.restaurantpos.users.entity.AuthenticationType.PASSWORD_AND_PIN);
        String adminPin = (request.getPin() != null && !request.getPin().isBlank()) ? request.getPin().trim() : "1111";
        if (!adminPin.matches("^[0-9]{4,6}$")) {
            adminPin = "1111";
        }
        user.setPinHash(passwordEncoder.encode(adminPin));
        user.setPinLookupHash(com.restaurantpos.users.service.UserService.computePinLookupHash(savedTenant.getId(), adminPin));
        user.getRoles().add(adminRole);
        user.setLastLoginAt(Instant.now());
        User savedUser = userRepository.save(user);

        log.info("Client self-registered successfully: {} for restaurant: {} ({})",
                username, savedTenant.getName(), savedTenant.getCode());

        UserPrincipal principal = buildPrincipal(savedUser);
        return buildTokenResponse(principal, savedTenant);
    }

    private String generateUniqueCode(String name) {
        String clean = name.replaceAll("[^a-zA-Z0-9]", "").toUpperCase(java.util.Locale.ROOT);
        String prefix = clean.length() >= 4 ? clean.substring(0, 4) : (clean + "REST").substring(0, 4);
        String code = prefix + "01";
        int counter = 1;
        while (tenantRepository.existsByCodeIgnoreCase(code)) {
            counter++;
            code = prefix + String.format("%02d", counter);
        }
        return code;
    }

    private void provisionDefaultRolesAndZone(Tenant tenant) {
        UUID tid = tenant.getId();
        try {
            String[] roles = {"ADMIN", "MANAGER", "WAITER", "KITCHEN", "CASHIER"};
            for (String roleName : roles) {
                if (roleRepository.findByNameAndTenantIdAndDeletedAtIsNull(roleName, tid).isEmpty()) {
                    com.restaurantpos.users.entity.Role r = new com.restaurantpos.users.entity.Role();
                    r.setTenant(tenant);
                    r.setName(roleName);
                    r.setDescription(roleName + " roli");
                    r.setSystem(true);
                    r.setActive(true);
                    com.restaurantpos.users.entity.Role savedRole = roleRepository.saveAndFlush(r);

                    jdbcTemplate.update("""
                        INSERT INTO role_permissions (role_id, permission_id)
                        SELECT ?, permission_id 
                        FROM role_permissions rp
                        JOIN roles r ON r.id = rp.role_id
                        WHERE r.name = ? AND r.tenant_id IS NOT NULL
                        LIMIT 50
                        ON CONFLICT DO NOTHING
                    """, savedRole.getId(), roleName);
                }
            }

            jdbcTemplate.update("""
                INSERT INTO table_zones (id, tenant_id, name, description, sort_order, is_active, created_at, updated_at)
                VALUES (gen_random_uuid(), ?, 'Asosiy Zal', '1-qavat', 1, TRUE, NOW(), NOW())
                ON CONFLICT DO NOTHING
            """, tid);
        } catch (Exception ex) {
            log.warn("Warning while provisioning default roles/zones for new restaurant {}: {}", tenant.getCode(), ex.getMessage());
        }
    }

    public AuthDto.TokenResponse issueTokensForUser(User user) {
        UserPrincipal principal = buildPrincipal(user);
        return buildTokenResponse(principal, user.getTenant());
    }

    private UserPrincipal buildPrincipal(User user) {
        Set<String> permissions = user.getRoles().stream()
                .flatMap(role -> role.getPermissions().stream())
                .map(p -> p.getCode())
                .collect(Collectors.toSet());

        Set<UUID> kitchenIds = user.getKitchens().stream()
                .map(com.restaurantpos.kitchen.entity.Kitchen::getId)
                .collect(Collectors.toSet());
        UUID primaryKitchenId = kitchenIds.isEmpty() ? null : kitchenIds.iterator().next();
        String role = user.getRoles().isEmpty() ? "STAFF" : user.getRoles().iterator().next().getName();

        return UserPrincipal.builder()
                .userId(user.getId())
                .tenantId(user.getTenant() != null ? user.getTenant().getId() : null)
                .kitchenId(primaryKitchenId)
                .kitchenIds(kitchenIds)
                .username(user.getUsername())
                .password(user.getPasswordHash())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(role)
                .permissions(permissions)
                .active(user.isActive())
                .build();
    }

    private AuthDto.TokenResponse buildTokenResponse(UserPrincipal principal, Tenant tenant) {
        String accessToken = jwtTokenProvider.generateAccessToken(principal);
        String refreshToken = jwtTokenProvider.generateRefreshToken(
                principal.getUserId(), principal.getTenantId());

        List<String> kitchenIdStrs = principal.getKitchenIds() != null
                ? principal.getKitchenIds().stream().map(UUID::toString).collect(Collectors.toList())
                : (principal.getKitchenId() != null ? List.of(principal.getKitchenId().toString()) : List.of());

        String restCode = tenant != null ? tenant.getCode() : null;
        String restName = tenant != null ? tenant.getName() : "Platform SuperAdmin";
        String restStatus = tenant != null && tenant.getStatus() != null ? tenant.getStatus().name() : "ACTIVE";
        boolean isSuperAdmin = principal.isSuperAdmin() || principal.getTenantId() == null;

        AuthDto.UserInfo userInfo = new AuthDto.UserInfo(
                principal.getUserId().toString(),
                principal.getUsername(),
                principal.getFullName(),
                principal.getTenantId() != null ? principal.getTenantId().toString() : null,
                restCode,
                restName,
                restStatus,
                isSuperAdmin,
                principal.getRole(),
                principal.getKitchenId() != null ? principal.getKitchenId().toString() : null,
                kitchenIdStrs,
                principal.getPermissions()
        );

        return new AuthDto.TokenResponse(accessToken, refreshToken, 900, userInfo);
    }
}
