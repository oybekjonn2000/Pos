package com.restaurantpos.billing.entity;

public enum SubscriptionStatus {
    TRIAL,
    ACTIVE,
    EXPIRING_SOON,
    EXPIRED,
    CANCELLED,
    SUSPENDED,
    PENDING_PAYMENT,
    PAYMENT_FAILED
}
