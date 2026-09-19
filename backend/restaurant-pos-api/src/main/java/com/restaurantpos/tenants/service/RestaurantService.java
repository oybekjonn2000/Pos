package com.restaurantpos.tenants.service;

import com.restaurantpos.common.exception.PosException;
import com.restaurantpos.tenants.dto.RestaurantDto;
import com.restaurantpos.tenants.entity.RestaurantStatus;
import com.restaurantpos.tenants.entity.Tenant;
import com.restaurantpos.tenants.repository.TenantRepository;
import com.restaurantpos.users.entity.Role;
import com.restaurantpos.users.entity.User;
import com.restaurantpos.users.repository.RoleRepository;
import com.restaurantpos.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RestaurantService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Transactional(readOnly = true)
    public List<RestaurantDto.Response> getAllRestaurants() {
        return tenantRepository.findAll().stream()
                .filter(t -> t.getDeletedAt() == null)
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RestaurantDto.Response getRestaurantById(UUID id) {
        Tenant tenant = tenantRepository.findById(id)
                .filter(t -> t.getDeletedAt() == null)
                .orElseThrow(() -> PosException.notFound("Restoran topilmadi: " + id));
        return toResponse(tenant);
    }

    @Transactional
    public RestaurantDto.Response createRestaurant(RestaurantDto.CreateRequest request) {
        String code = request.getCode().trim().toUpperCase(Locale.ROOT);
        if (tenantRepository.existsByCodeIgnoreCase(code)) {
            throw PosException.badRequest("Ushbu restoran kodi ('" + code + "') allaqachon mavjud!");
        }

        String slug = request.getSlug() != null && !request.getSlug().isBlank()
                ? request.getSlug().trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9-]", "-")
                : code.toLowerCase(Locale.ROOT);

        if (tenantRepository.existsBySlug(slug)) {
            slug = slug + "-" + UUID.randomUUID().toString().substring(0, 4);
        }

        Tenant tenant = new Tenant();
        tenant.setName(request.getName().trim());
        tenant.setCode(code);
        tenant.setSlug(slug);
        tenant.setPhone(request.getPhone());
        tenant.setEmail(request.getEmail());
        tenant.setAddress(request.getAddress());
        tenant.setCity(request.getCity());
        tenant.setInn(request.getInn());
        tenant.setCurrency(request.getCurrency() != null ? request.getCurrency() : "UZS");
        tenant.setTimezone(request.getTimezone() != null ? request.getTimezone() : "Asia/Tashkent");
        tenant.setStatus(RestaurantStatus.ACTIVE);
        tenant.setActive(true);

        Tenant saved = tenantRepository.save(tenant);
        log.info("New restaurant created: {} ({}) with ID: {}", saved.getName(), saved.getCode(), saved.getId());

        // Provision default roles and starter zone for new restaurant
        provisionDefaultRolesAndZone(saved);

        return toResponse(saved);
    }

    @Transactional
    public RestaurantDto.Response updateRestaurant(UUID id, RestaurantDto.UpdateRequest request) {
        Tenant tenant = tenantRepository.findById(id)
                .filter(t -> t.getDeletedAt() == null)
                .orElseThrow(() -> PosException.notFound("Restoran topilmadi: " + id));

        tenant.setName(request.getName().trim());
        tenant.setPhone(request.getPhone());
        tenant.setEmail(request.getEmail());
        tenant.setAddress(request.getAddress());
        tenant.setCity(request.getCity());
        tenant.setInn(request.getInn());
        if (request.getLogoUrl() != null) {
            tenant.setLogoUrl(request.getLogoUrl());
        }

        Tenant updated = tenantRepository.save(tenant);
        return toResponse(updated);
    }

    @Transactional
    public RestaurantDto.Response updateRestaurantStatus(UUID id, RestaurantStatus newStatus) {
        Tenant tenant = tenantRepository.findById(id)
                .filter(t -> t.getDeletedAt() == null)
                .orElseThrow(() -> PosException.notFound("Restoran topilmadi: " + id));

        tenant.setStatus(newStatus);
        tenant.setActive(newStatus == RestaurantStatus.ACTIVE);
        Tenant updated = tenantRepository.save(tenant);
        log.warn("Restaurant status updated: {} ({}) -> {}", updated.getName(), updated.getCode(), newStatus);
        return toResponse(updated);
    }

    @Transactional
    public void createRestaurantAdmin(UUID restaurantId, RestaurantDto.CreateAdminRequest request) {
        Tenant tenant = tenantRepository.findById(restaurantId)
                .filter(t -> t.getDeletedAt() == null)
                .orElseThrow(() -> PosException.notFound("Restoran topilmadi: " + restaurantId));

        String username = request.getUsername().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByUsernameAndTenantIdAndDeletedAtIsNull(username, restaurantId)) {
            throw PosException.badRequest("Ushbu restoranda '" + username + "' nomli foydalanuvchi allaqachon mavjud!");
        }

        // Find or create ADMIN role for this tenant
        Role adminRole = roleRepository.findByNameAndTenantIdAndDeletedAtIsNull("ADMIN", restaurantId)
                .or(() -> roleRepository.findByNameAndTenantIdAndDeletedAtIsNull("RESTAURANT_ADMIN", restaurantId))
                .orElseGet(() -> {
                    Role r = new Role();
                    r.setTenant(tenant);
                    r.setName("ADMIN");
                    r.setDescription("Restoran Bosh Admini");
                    r.setSystem(true);
                    r.setActive(true);
                    return roleRepository.save(r);
                });

        User user = new User();
        user.setTenant(tenant);
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName() != null ? request.getLastName().trim() : "");
        user.setPhone(request.getPhone());
        user.setEmail(request.getEmail());
        user.setActive(true);
        user.getRoles().add(adminRole);

        userRepository.save(user);
        log.info("Created restaurant admin '{}' for restaurant: {} ({})", username, tenant.getName(), tenant.getCode());
    }

    private void provisionDefaultRolesAndZone(Tenant tenant) {
        UUID tid = tenant.getId();
        try {
            // Seed standard roles for this tenant if not existing
            String[] roles = {"ADMIN", "MANAGER", "WAITER", "KITCHEN", "CASHIER"};
            for (String roleName : roles) {
                if (roleRepository.findByNameAndTenantIdAndDeletedAtIsNull(roleName, tid).isEmpty()) {
                    Role r = new Role();
                    r.setTenant(tenant);
                    r.setName(roleName);
                    r.setDescription(roleName + " roli");
                    r.setSystem(true);
                    r.setActive(true);
                    Role savedRole = roleRepository.saveAndFlush(r);

                    // Copy permissions from template role if available
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

            // Create initial table zone: "Asosiy Zal"
            jdbcTemplate.update("""
                INSERT INTO table_zones (id, tenant_id, name, description, sort_order, is_active, created_at, updated_at)
                VALUES (gen_random_uuid(), ?, 'Asosiy Zal', '1-qavat', 1, TRUE, NOW(), NOW())
                ON CONFLICT DO NOTHING
            """, tid);

        } catch (Exception ex) {
            log.warn("Warning while provisioning default roles/zones for new restaurant {}: {}", tenant.getCode(), ex.getMessage());
        }
    }

    private RestaurantDto.Response toResponse(Tenant t) {
        UUID tid = t.getId();
        long userCount = 0;
        long tableCount = 0;
        long orderCount = 0;

        try {
            Long uc = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users WHERE tenant_id = ? AND deleted_at IS NULL", Long.class, tid);
            userCount = uc != null ? uc : 0;
            Long tc = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM restaurant_tables WHERE tenant_id = ? AND deleted_at IS NULL", Long.class, tid);
            tableCount = tc != null ? tc : 0;
            Long oc = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM orders WHERE tenant_id = ? AND deleted_at IS NULL", Long.class, tid);
            orderCount = oc != null ? oc : 0;
        } catch (Exception e) {
            log.debug("Error computing metrics for tenant {}: {}", tid, e.getMessage());
        }

        return RestaurantDto.Response.builder()
                .id(t.getId())
                .name(t.getName())
                .code(t.getCode())
                .slug(t.getSlug())
                .phone(t.getPhone())
                .email(t.getEmail())
                .address(t.getAddress())
                .city(t.getCity())
                .inn(t.getInn())
                .status(t.getStatus() != null ? t.getStatus().name() : "ACTIVE")
                .active(t.isOperating())
                .createdAt(t.getCreatedAt())
                .userCount(userCount)
                .tableCount(tableCount)
                .orderCount(orderCount)
                .build();
    }
}
