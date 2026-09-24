package com.restaurantpos.common.util;

public final class PhoneNormalizer {

    private PhoneNormalizer() {
    }

    /**
     * Normalizes a phone number to standard Uzbekistan format (+998XXXXXXXXX).
     * Handles:
     * - +998 90 123 45 67
     * - 998901234567
     * - 901234567
     * - +998-90-123-45-67
     * - (90) 123-45-67
     */
    public static String normalize(String phone) {
        if (phone == null || phone.isBlank()) {
            return null;
        }

        String digits = phone.replaceAll("[^0-9]", "");
        if (digits.isBlank()) {
            return phone.trim();
        }

        if (digits.length() == 9) {
            return "+998" + digits;
        } else if (digits.length() == 12 && digits.startsWith("998")) {
            return "+" + digits;
        }

        return "+" + digits;
    }
}
