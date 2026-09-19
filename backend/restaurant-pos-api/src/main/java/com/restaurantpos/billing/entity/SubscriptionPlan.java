package com.restaurantpos.billing.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "subscription_plans")
@Getter
@Setter
public class SubscriptionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "price", nullable = false, precision = 15, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "yearly_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal yearlyPrice = BigDecimal.ZERO;

    @Column(name = "currency", nullable = false, length = 10)
    private String currency = "UZS";

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_period", nullable = false, length = 20)
    private BillingPeriod billingPeriod = BillingPeriod.MONTHLY;

    @Column(name = "trial_enabled", nullable = false)
    private boolean trialEnabled = false;

    @Column(name = "trial_days", nullable = false)
    private Integer trialDays = 0;

    @Column(name = "max_users")
    private Integer maxUsers = 10;

    @Column(name = "max_tables")
    private Integer maxTables = 30;

    @Column(name = "max_products")
    private Integer maxProducts = 200;

    @Column(name = "max_kitchens")
    private Integer maxKitchens = 2;

    @Column(name = "max_devices")
    private Integer maxDevices = 5;

    @Column(name = "max_branches")
    private Integer maxBranches = 1;

    @Column(name = "max_orders_per_month")
    private Integer maxOrdersPerMonth = 5000;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "features", columnDefinition = "jsonb")
    private List<String> features = new ArrayList<>();

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "is_archived", nullable = false)
    private boolean archived = false;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public boolean hasFeature(String feature) {
        if (features == null || feature == null) return false;
        return features.stream().anyMatch(f -> f.equalsIgnoreCase(feature));
    }
}
