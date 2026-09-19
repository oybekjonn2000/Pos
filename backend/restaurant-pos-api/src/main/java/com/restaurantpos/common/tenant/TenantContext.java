package com.restaurantpos.common.tenant;

import com.restaurantpos.auth.security.UserPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.UUID;

/**
 * Global accessor for Current Tenant and User context in multi-tenant operations.
 * Extracts context directly from the authenticated UserPrincipal.
 */
public final class TenantContext {

    private static final ThreadLocal<UUID> EXPLICIT_TENANT_OVERRIDE = new ThreadLocal<>();

    private TenantContext() {
        // Utility class
    }

    /**
     * Get the authenticated user's principal from SecurityContext, if available.
     */
    public static Optional<UserPrincipal> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            return Optional.of(principal);
        }
        return Optional.empty();
    }

    /**
     * Get the current tenant ID.
     * Returns explicit ThreadLocal override if set (e.g. background job),
     * otherwise extracts from the current authenticated UserPrincipal.
     */
    public static UUID getCurrentTenantId() {
        UUID override = EXPLICIT_TENANT_OVERRIDE.get();
        if (override != null) {
            return override;
        }
        return getCurrentUser()
                .map(UserPrincipal::getTenantId)
                .orElse(null);
    }

    /**
     * Get the current authenticated user's ID.
     */
    public static UUID getCurrentUserId() {
        return getCurrentUser()
                .map(UserPrincipal::getUserId)
                .orElse(null);
    }

    /**
     * Check if the current caller has SUPER_ADMIN platform privileges.
     */
    public static boolean isSuperAdmin() {
        return getCurrentUser()
                .map(UserPrincipal::isSuperAdmin)
                .orElse(false);
    }

    /**
     * Set explicit tenant override for internal background execution.
     */
    public static void setExplicitTenant(UUID tenantId) {
        EXPLICIT_TENANT_OVERRIDE.set(tenantId);
    }

    /**
     * Clear explicit tenant override.
     */
    public static void clear() {
        EXPLICIT_TENANT_OVERRIDE.remove();
    }
}
