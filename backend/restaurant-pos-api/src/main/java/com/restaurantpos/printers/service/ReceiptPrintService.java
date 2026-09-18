package com.restaurantpos.printers.service;

import com.restaurantpos.common.exception.PosException;
import com.restaurantpos.orders.entity.Order;
import com.restaurantpos.orders.entity.OrderItem;
import com.restaurantpos.payments.entity.Payment;
import com.restaurantpos.printers.entity.Printer;
import com.restaurantpos.settings.repository.AppSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReceiptPrintService {

    private final WindowsPrintService windowsPrintService;
    private final AppSettingRepository appSettingRepository;

    /**
     * Formats and prints a customer receipt to the cashier Windows printer.
     */
    public void printReceipt(Printer printer, Order order, Payment payment, boolean isReprint) {
        if (printer.getStatus() == Printer.PrinterStatus.OFFLINE) {
            throw PosException.badRequest("Printer OFFLINE holatda: " + printer.getName());
        }

        int width = printer.getPaperWidth() <= 58 ? 58 : 80;
        int maxChars = width == 58 ? 32 : 42;

        ZoneId zoneId = ZoneId.of("Asia/Tashkent");
        Instant receiptTime = (payment != null && payment.getPaidAt() != null) ? payment.getPaidAt() : Instant.now();
        String dateStr = DateTimeFormatter.ofPattern("yyyy-MM-dd").withZone(zoneId).format(receiptTime);
        String timeStr = DateTimeFormatter.ofPattern("HH:mm:ss").withZone(zoneId).format(receiptTime);

        UUID tenantId = (order.getTenant() != null) ? order.getTenant().getId() : null;

        String restName = "OYBEK RESTAURANT & LOUNGE";
        String restAddress = "Qarshi sh., Mustaqillik shox ko'chasi";
        String restPhone = "Tel: +998 90 123 45 67";

        boolean serviceChargeEnabled = true;
        double serviceChargePercent = 10.0;
        boolean showServiceCharge = true;
        boolean showDiscount = true;
        boolean showTax = false;

        if (tenantId != null && appSettingRepository != null) {
            restName = appSettingRepository.findByTenantIdAndCategoryAndKey(tenantId, "RECEIPT", "restaurantName")
                    .map(s -> s.getValue()).filter(v -> !v.isBlank())
                    .orElseGet(() -> order.getTenant() != null && order.getTenant().getName() != null ? order.getTenant().getName() : "OYBEK RESTAURANT & LOUNGE");

            restAddress = appSettingRepository.findByTenantIdAndCategoryAndKey(tenantId, "RECEIPT", "address")
                    .map(s -> s.getValue()).filter(v -> !v.isBlank())
                    .orElseGet(() -> order.getTenant() != null && order.getTenant().getAddress() != null ? order.getTenant().getAddress() : "Qarshi sh., Mustaqillik shox ko'chasi");

            restPhone = appSettingRepository.findByTenantIdAndCategoryAndKey(tenantId, "RECEIPT", "phone")
                    .map(s -> s.getValue()).filter(v -> !v.isBlank())
                    .orElseGet(() -> order.getTenant() != null && order.getTenant().getPhone() != null ? order.getTenant().getPhone() : "Tel: +998 90 123 45 67");

            serviceChargeEnabled = appSettingRepository.findByTenantIdAndCategoryAndKey(tenantId, "TAX_SERVICE", "serviceChargeEnabled")
                    .map(s -> Boolean.parseBoolean(s.getValue()))
                    .orElse(true);

            serviceChargePercent = appSettingRepository.findByTenantIdAndCategoryAndKey(tenantId, "TAX_SERVICE", "serviceChargePercent")
                    .map(s -> {
                        try { return Double.parseDouble(s.getValue()); } catch (Exception e) { return 10.0; }
                    })
                    .orElse(10.0);

            showServiceCharge = appSettingRepository.findByTenantIdAndCategoryAndKey(tenantId, "RECEIPT", "showServiceCharge")
                    .map(s -> Boolean.parseBoolean(s.getValue()))
                    .orElse(true);

            showDiscount = appSettingRepository.findByTenantIdAndCategoryAndKey(tenantId, "RECEIPT", "showDiscount")
                    .map(s -> Boolean.parseBoolean(s.getValue()))
                    .orElse(true);

            showTax = appSettingRepository.findByTenantIdAndCategoryAndKey(tenantId, "RECEIPT", "showTax")
                    .map(s -> Boolean.parseBoolean(s.getValue()))
                    .orElse(false);
        }

        boolean isPaid = (payment != null && payment.getStatus() == Payment.PaymentStatus.COMPLETED)
                || order.getPaymentStatus() == Order.PaymentStatus.PAID;

        String placeName = order.getZone() != null ? order.getZone().getName() : (order.getTable() != null && order.getTable().getZone() != null ? order.getTable().getZone().getName() : null);
        String tableName = order.getTable() != null ? order.getTable().getName() : "Olib ketish";
        String displayPlace;
        if (placeName != null && !placeName.isBlank()) {
            if (tableName != null && !tableName.isBlank() && !placeName.trim().equalsIgnoreCase(tableName.trim())) {
                displayPlace = placeName + " - " + tableName;
            } else {
                displayPlace = placeName;
            }
        } else {
            displayPlace = tableName != null ? tableName : "Joy ko'rsatilmagan";
        }
        String waiterName = (order.getWaiter() != null && order.getWaiter().getFullName() != null)
                ? order.getWaiter().getFullName() : "Noma'lum";
        String cashierName = payment != null && payment.getCashier() != null
                ? payment.getCashier().getFullName() : null;

        String divider = width == 58 ? "--------------------------------\n" : "------------------------------------------\n";
        String doubleDivider = width == 58 ? "================================\n" : "==========================================\n";

        StringBuilder sb = new StringBuilder();
        sb.append("\n").append(doubleDivider);
        sb.append(centerText(restName, maxChars)).append("\n");
        sb.append(centerText(restAddress, maxChars)).append("\n");
        sb.append(centerText(restPhone, maxChars)).append("\n");
        sb.append(doubleDivider);

        if (!isPaid) {
            sb.append(centerText("*** HISOB CHEKI ***", maxChars)).append("\n");
            sb.append(doubleDivider);
        } else if (isReprint) {
            sb.append(centerText("*** QAYTA CHOP ETILDI (NUSXA) ***", maxChars)).append("\n");
            sb.append(doubleDivider);
        } else {
            sb.append(centerText("*** KASSA CHEKI ***", maxChars)).append("\n");
            sb.append(doubleDivider);
        }

        // Order type header
        if (order.getOrderType() == Order.OrderType.TAKEAWAY) {
            sb.append(centerText("🛍 OLIB KETISH", maxChars)).append("\n");
            sb.append(doubleDivider);
        }

        String checkNum = payment != null && payment.getPaymentNumber() != null
                ? payment.getPaymentNumber() : order.getOrderNumber();

        sb.append(String.format("BUYURTMA №:   %s\n", order.getOrderNumber()));
        if (isPaid) {
            sb.append(String.format("CHEK RAQAMI:  %s\n", checkNum));
        }
        sb.append(String.format("JOY / STOL:   %s\n", displayPlace));
        sb.append(String.format("OFITSIANT:    %s\n", waiterName));
        if (isPaid && cashierName != null && !cashierName.isBlank()) {
            sb.append(String.format("KASSIR:       %s\n", cashierName));
        }
        sb.append(String.format("SANA VA VAQT: %s  %s\n", dateStr, timeStr));
        sb.append(divider);

        if (width == 58) {
            sb.append("MAHSULOT          NARX  DONA   JAMI\n");
            sb.append(divider);
            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    if (item.isVoided()) continue;
                    sb.append(truncate(item.getProductName(), 32)).append("\n");
                    String qtyStr = (item.getQuantity().remainder(BigDecimal.ONE).compareTo(BigDecimal.ZERO) == 0)
                            ? String.valueOf(item.getQuantity().intValue())
                            : String.format(java.util.Locale.US, "%.2f", item.getQuantity());
                    String leftPart = String.format(" %s x %s =", formatMoney(item.getUnitPrice()), qtyStr);
                    String rightPart = formatMoney(item.getSubtotal());
                    sb.append(formatTwoColumns(leftPart, rightPart, 32)).append("\n");
                }
            }
        } else {
            sb.append("MAHSULOT                NARX   DONA     JAMI\n");
            sb.append(divider);
            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    if (item.isVoided()) continue;
                    sb.append(truncate(item.getProductName(), 42)).append("\n");
                    String qtyStr = (item.getQuantity().remainder(BigDecimal.ONE).compareTo(BigDecimal.ZERO) == 0)
                            ? String.valueOf(item.getQuantity().intValue())
                            : String.format(java.util.Locale.US, "%.2f", item.getQuantity());
                    String leftPart = String.format("   %s x %s =", formatMoney(item.getUnitPrice()), qtyStr);
                    String rightPart = formatMoney(item.getSubtotal());
                    sb.append(formatTwoColumns(leftPart, rightPart, 42)).append("\n");
                }
            }
        }

        BigDecimal subtotal = order.getSubtotal() != null ? order.getSubtotal() : BigDecimal.ZERO;
        BigDecimal discountAmount = order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal discountPercent = order.getDiscountPercent();
        BigDecimal netAmount = subtotal.subtract(discountAmount).max(BigDecimal.ZERO);
        BigDecimal taxAmount = order.getTaxAmount() != null ? order.getTaxAmount() : BigDecimal.ZERO;

        BigDecimal serviceChargeAmount = (order.getPlaceFee() != null && order.getPlaceFee().compareTo(BigDecimal.ZERO) > 0)
                ? order.getPlaceFee() : BigDecimal.ZERO;
        double effectiveServicePercent = (order.getPlacePercentage() != null && order.getPlacePercentage().compareTo(BigDecimal.ZERO) > 0)
                ? order.getPlacePercentage().doubleValue() : serviceChargePercent;

        if (serviceChargeAmount.compareTo(BigDecimal.ZERO) == 0) {
            if (payment != null && payment.getAmount() != null && payment.getAmount().compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal paid = payment.getAmount();
                BigDecimal baseTotal = netAmount.add(taxAmount);
                if (paid.compareTo(baseTotal) > 0) {
                    serviceChargeAmount = paid.subtract(baseTotal);
                    if (netAmount.compareTo(BigDecimal.ZERO) > 0) {
                        effectiveServicePercent = serviceChargeAmount.multiply(BigDecimal.valueOf(100))
                                .divide(netAmount, 1, RoundingMode.HALF_UP)
                                .doubleValue();
                    }
                } else if (serviceChargeEnabled && showServiceCharge && serviceChargePercent > 0) {
                    serviceChargeAmount = netAmount.multiply(BigDecimal.valueOf(serviceChargePercent))
                            .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
                }
            } else if (serviceChargeEnabled && showServiceCharge && serviceChargePercent > 0) {
                serviceChargeAmount = netAmount.multiply(BigDecimal.valueOf(serviceChargePercent))
                        .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
            }
        }

        BigDecimal finalTotal;
        if (payment != null && payment.getAmount() != null && payment.getAmount().compareTo(BigDecimal.ZERO) > 0) {
            finalTotal = payment.getAmount();
        } else {
            finalTotal = netAmount.add(serviceChargeAmount).add(taxAmount);
        }

        sb.append(divider);
        String subtotalVal = formatMoney(subtotal) + " so'm";
        sb.append(formatTwoColumns("Mahsulotlar summasi:", subtotalVal, maxChars)).append("\n");

        if (discountAmount.compareTo(BigDecimal.ZERO) > 0 && showDiscount) {
            String pctStr = (discountPercent != null && discountPercent.compareTo(BigDecimal.ZERO) > 0)
                    ? String.format(" (%.0f%%)", discountPercent) : "";
            String lbl = "Chegirma" + pctStr + ":";
            String val = "-" + formatMoney(discountAmount) + " so'm";
            sb.append(formatTwoColumns(lbl, val, maxChars)).append("\n");
        }

        if (serviceChargeAmount.compareTo(BigDecimal.ZERO) > 0) {
            String pctStr = (effectiveServicePercent % 1 == 0)
                    ? String.format("%.0f%%", effectiveServicePercent)
                    : String.format("%.1f%%", effectiveServicePercent);
            String lbl = String.format("Joy foizi (%s):", pctStr);
            String val = "+" + formatMoney(serviceChargeAmount) + " so'm";
            sb.append(formatTwoColumns(lbl, val, maxChars)).append("\n");
        }

        if (taxAmount.compareTo(BigDecimal.ZERO) > 0 && showTax) {
            String lbl = "Soliq (QQS):";
            String val = "+" + formatMoney(taxAmount) + " so'm";
            sb.append(formatTwoColumns(lbl, val, maxChars)).append("\n");
        }

        sb.append(doubleDivider);
        sb.append(centerText("JAMI TO'LOV:", maxChars)).append("\n");

        String formattedTotal = formatMoney(finalTotal) + " so'm";
        String totalBoxed = ">> " + formattedTotal + " <<";

        // ESC/POS control bytes: Bold ON (\u001B\u0045\u0001), Double Height ON (\u001D\u0021\u0001)
        sb.append("\u001B\u0045\u0001\u001D\u0021\u0001");
        sb.append(centerText(totalBoxed, maxChars)).append("\n");
        sb.append("\u001D\u0021\u0000\u001B\u0045\u0000");

        sb.append(doubleDivider);

        if (!isPaid) {
            sb.append(centerText("Holati: TO'LANMAGAN", maxChars)).append("\n");
            sb.append(centerText("(To'lov kassada qabul qilinadi)", maxChars)).append("\n");
            sb.append(divider);
            sb.append(centerText("Rahmat, yana kutib qolamiz!", maxChars)).append("\n");
        } else {
            sb.append(formatTwoColumns("To'lov holati:", "TO'LANGAN", maxChars)).append("\n");
            if (payment != null) {
                String payMethod = payment.getPaymentMethod() != null ? payment.getPaymentMethod().name() : "NAQD";
                if ("CASH".equalsIgnoreCase(payMethod)) payMethod = "NAQD";
                else if ("CARD".equalsIgnoreCase(payMethod)) payMethod = "KARTA";

                sb.append(formatTwoColumns("To'lov turi:", payMethod, maxChars)).append("\n");
                if (payment.getPaidAt() != null) {
                    String paidTime = payment.getPaidAt().atZone(zoneId).format(DateTimeFormatter.ofPattern("HH:mm:ss"));
                    sb.append(formatTwoColumns("To'lov vaqti:", paidTime, maxChars)).append("\n");
                }
                sb.append(formatTwoColumns("To'langan summa:", formatMoney(payment.getAmount()) + " so'm", maxChars)).append("\n");
                if (payment.getChangeAmount() != null && payment.getChangeAmount().compareTo(BigDecimal.ZERO) > 0) {
                    sb.append(formatTwoColumns("Qaytim:", formatMoney(payment.getChangeAmount()) + " so'm", maxChars)).append("\n");
                }
            }
            sb.append(divider);
            sb.append(centerText("Xaridingiz uchun rahmat!", maxChars)).append("\n");
            sb.append(centerText("Yana kutib qolamiz!", maxChars)).append("\n");
        }
        sb.append("\n\n\n\n");

        String textContent = sb.toString();
        byte[] rawBytes = buildEscPosPayload(textContent);

        String winName = printer.getWindowsPrinterName();
        log.info("Sending cashier receipt to Windows printer '{}' for order '{}'", winName, order.getOrderNumber());

        windowsPrintService.print(winName, rawBytes, textContent);
    }

    private byte[] buildEscPosPayload(String text) {
        byte[] textBytes = text.getBytes(StandardCharsets.UTF_8);
        byte[] escInit = new byte[]{0x1B, 0x40}; // ESC @
        byte[] cut = new byte[]{0x1D, 0x56, 0x41, 0x10}; // GS V A 16

        byte[] result = new byte[escInit.length + textBytes.length + cut.length];
        System.arraycopy(escInit, 0, result, 0, escInit.length);
        System.arraycopy(textBytes, 0, result, escInit.length, textBytes.length);
        System.arraycopy(cut, 0, result, escInit.length + textBytes.length, cut.length);
        return result;
    }

    private int visibleLength(String str) {
        if (str == null) return 0;
        return str.replaceAll("[\\x00-\\x1F]", "").length();
    }

    private String formatMoney(BigDecimal amount) {
        if (amount == null) return "0";
        return String.format(java.util.Locale.US, "%,.0f", amount).replace(',', ' ');
    }

    private String formatTwoColumns(String left, String right, int width) {
        int totalLen = visibleLength(left) + visibleLength(right);
        if (totalLen >= width) {
            return left + " " + right;
        }
        return left + " ".repeat(width - totalLen) + right;
    }

    private String centerText(String text, int width) {
        int vLen = visibleLength(text);
        if (vLen >= width) return text;
        int pad = (width - vLen) / 2;
        return " ".repeat(pad) + text;
    }

    private String truncate(String text, int max) {
        if (text == null) return "";
        return text.length() <= max ? text : text.substring(0, max);
    }
}
