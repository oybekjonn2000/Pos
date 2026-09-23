package com.restaurantpos.billing.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "plan_features", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"plan_id", "feature_id"})
})
@Getter
@Setter
@NoArgsConstructor
public class PlanFeature {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plan_id", nullable = false)
    private SubscriptionPlan plan;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "feature_id", nullable = false)
    private SubscriptionFeature feature;

    @Column(name = "is_enabled", nullable = false)
    private boolean enabled = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public PlanFeature(SubscriptionPlan plan, SubscriptionFeature feature, boolean enabled) {
        this.plan = plan;
        this.feature = feature;
        this.enabled = enabled;
        this.createdAt = Instant.now();
    }
}
