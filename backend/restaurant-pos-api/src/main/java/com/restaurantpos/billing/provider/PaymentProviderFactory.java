package com.restaurantpos.billing.provider;

import com.restaurantpos.billing.entity.PaymentProviderType;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Component
public class PaymentProviderFactory {

    private final Map<PaymentProviderType, PaymentProvider> providers = new EnumMap<>(PaymentProviderType.class);

    public PaymentProviderFactory(List<PaymentProvider> providerList) {
        for (PaymentProvider provider : providerList) {
            providers.put(provider.getType(), provider);
        }
    }

    public PaymentProvider getProvider(PaymentProviderType type) {
        if (type == null) {
            return providers.getOrDefault(PaymentProviderType.MANUAL, providers.get(PaymentProviderType.MOCK));
        }
        PaymentProvider provider = providers.get(type);
        if (provider == null) {
            return providers.getOrDefault(PaymentProviderType.MANUAL, providers.get(PaymentProviderType.MOCK));
        }
        return provider;
    }
}
