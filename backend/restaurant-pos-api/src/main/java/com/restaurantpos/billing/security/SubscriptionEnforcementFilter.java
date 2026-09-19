package com.restaurantpos.billing.security;

import com.restaurantpos.billing.service.SubscriptionService;
import com.restaurantpos.common.tenant.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class SubscriptionEnforcementFilter extends OncePerRequestFilter {

    private final SubscriptionService subscriptionService;

    private static final Set<String> EXEMPT_PREFIXES = Set.of(
            "/api/auth",
            "/api/public",
            "/api/webhooks",
            "/api/platform",
            "/api/restaurant/billing",
            "/api/settings",
            "/api-docs",
            "/swagger-ui",
            "/actuator",
            "/ws",
            "/uploads"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod();

        // Check if path is exempt
        for (String prefix : EXEMPT_PREFIXES) {
            if (path.startsWith(prefix)) {
                filterChain.doFilter(request, response);
                return;
            }
        }

        // Only enforce on authenticated requests
        UUID tenantId = TenantContext.getCurrentTenantId();
        if (tenantId == null || TenantContext.isSuperAdmin()) {
            filterChain.doFilter(request, response);
            return;
        }

        // Allow read-only (GET) requests so historical data, reports, products, and tables are preserved
        if ("GET".equalsIgnoreCase(method) || "OPTIONS".equalsIgnoreCase(method) || "HEAD".equalsIgnoreCase(method)) {
            filterChain.doFilter(request, response);
            return;
        }

        // For business mutations (POST, PUT, DELETE, PATCH), verify subscription status
        boolean allowed = subscriptionService.isTenantOperationAllowed(tenantId);
        if (!allowed) {
            log.warn("Blocked business operation '{} {}' for tenant {} due to expired or inactive subscription",
                    method, path, tenantId);

            response.setStatus(HttpStatus.PAYMENT_REQUIRED.value()); // 402 Payment Required
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");

            String json = """
                {
                  "success": false,
                  "code": "SUBSCRIPTION_EXPIRED",
                  "message": "Obunangiz muddati tugagan. POS operatsiyalarini davom ettirish uchun tarifni yangilang.",
                  "action": "UPGRADE_OR_RENEW",
                  "billingUrl": "/restaurant/billing"
                }
                """;
            response.getWriter().write(json);
            return;
        }

        filterChain.doFilter(request, response);
    }
}
