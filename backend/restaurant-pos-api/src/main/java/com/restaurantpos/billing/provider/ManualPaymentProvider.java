package com.restaurantpos.billing.provider;

import com.restaurantpos.billing.entity.PaymentProviderType;
import com.restaurantpos.billing.entity.SubscriptionPayment;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class ManualPaymentProvider implements PaymentProvider {

    @Override
    public PaymentProviderType getType() {
        return PaymentProviderType.MANUAL;
    }

    @Override
    public String generateCheckoutUrl(SubscriptionPayment payment) {
        return "/restaurant/billing?invoiceId=" + (payment.getInvoice() != null ? payment.getInvoice().getId() : "");
    }

    @Override
    public boolean verifyWebhook(String payload, Map<String, String> headers) {
        return false;
    }
}
