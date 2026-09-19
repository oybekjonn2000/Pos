package com.restaurantpos.billing.provider;

import com.restaurantpos.billing.entity.PaymentProviderType;
import com.restaurantpos.billing.entity.SubscriptionPayment;

import java.util.Map;

public interface PaymentProvider {
    PaymentProviderType getType();
    String generateCheckoutUrl(SubscriptionPayment payment);
    boolean verifyWebhook(String payload, Map<String, String> headers);
}
