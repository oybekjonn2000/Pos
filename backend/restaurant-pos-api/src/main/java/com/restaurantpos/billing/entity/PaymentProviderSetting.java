package com.restaurantpos.billing.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payment_provider_settings")
@Getter
@Setter
@NoArgsConstructor
public class PaymentProviderSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "provider_code", nullable = false, unique = true, length = 50)
    private String providerCode;

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    @Column(name = "is_enabled", nullable = false)
    private boolean enabled = false;

    @Column(name = "is_test_mode", nullable = false)
    private boolean testMode = true;

    @Column(name = "merchant_id")
    private String merchantId;

    @Column(name = "api_key")
    private String apiKey;

    @Column(name = "secret_key")
    private String secretKey;

    @Column(name = "callback_url")
    private String callbackUrl;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
