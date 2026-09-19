package com.restaurantpos.billing.entity;

import com.restaurantpos.tenants.entity.Tenant;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "restaurant_subscriptions")
@Getter
@Setter
public class RestaurantSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "plan_id", nullable = false)
    private SubscriptionPlan plan;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private SubscriptionStatus status = SubscriptionStatus.TRIAL;

    @Column(name = "start_date", nullable = false)
    private Instant startDate = Instant.now();

    @Column(name = "end_date", nullable = false)
    private Instant endDate;

    @Column(name = "auto_renew", nullable = false)
    private boolean autoRenew = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    /**
     * Checks whether this subscription is currently operating and not expired.
     */
    public boolean isOperating() {
        boolean validStatus = status == SubscriptionStatus.ACTIVE || status == SubscriptionStatus.TRIAL;
        boolean notExpired = endDate != null && Instant.now().isBefore(endDate);
        return validStatus && notExpired;
    }

    /**
     * Calculates remaining days until subscription expires.
     */
    public long getDaysRemaining() {
        if (endDate == null) return 0;
        long seconds = endDate.getEpochSecond() - Instant.now().getEpochSecond();
        return seconds > 0 ? (seconds / 86400) : 0;
    }
}
