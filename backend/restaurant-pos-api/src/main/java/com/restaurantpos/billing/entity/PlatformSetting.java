package com.restaurantpos.billing.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "platform_settings")
@Getter
@Setter
public class PlatformSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "payment_card_number", length = 50)
    private String paymentCardNumber;

    @Column(name = "payment_card_holder", length = 150)
    private String paymentCardHolder;

    @Column(name = "payment_bank_name", length = 150)
    private String paymentBankName;

    @Column(name = "payment_instructions", columnDefinition = "TEXT")
    private String paymentInstructions;

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    @PreUpdate
    @PrePersist
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
