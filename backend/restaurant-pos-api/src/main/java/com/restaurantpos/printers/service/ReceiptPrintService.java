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

        String tableName = order.getTable() != null ? order.getTable().getName() : "Olib ketish";
        String waiterName = (order.getWaiter() != null && order.getWaiter().getFullName() != null)
                ? order.getWaiter().getFullName() : "Noma'lum";
        String cashierName = payment != null && payment.getCashier() != null
                ? payment.getCashier().getFullName() : "Kassir";

        String divider = width == 58 ? "--------------------------------\n" : "------------------------------------------\n";
        String doubleDivider = width == 58 ? "================================\n" : "==========================================\n";

        StringBuilder sb = new StringBuilder();
        sb.append("\n").append(doubleDivider);
        sb.append(centerText(restName, maxChars)).append("\n");
        sb.append(centerText(restAddress, maxChars)).append("\n");
        sb.append(centerText(restPhone, maxChars)).append("\n");
        sb.append(doubleDivider);

        if (isReprint) {
            sb.append(centerText("*** NUSXA / REPRINT CHEK ***", maxChars)).append("\n");
            sb.append(doubleDivider);
        }

        String checkNum = payment != null && payment.getPaymentNumber() != null
                ? payment.getPaymentNumber() : order.getOrderNumber();

        sb.append(String.format("BUYURTMA RAQAMI: %s\n", order.getOrderNumber()));
        sb.append(String.format("CHEK RAQAMI:     %s\n", checkNum));
        sb.append(String.format("STOL RAQAMI:     %s\n", tableName));
        sb.append(String.format("OFITSIANT:       %s\n", waiterName));
        sb.append(String.format("KASSIR:          %s\n", cashierName));
        sb.append(String.format("SANA:            %s\n", dateStr));
        sb.append(String.format("VAQT:            %s\n", timeStr));
        sb.append(divider);

        if (width == 58) {
            sb.append("MAHSULOT          NARX  DONA   JAMI\n");
            sb.append(divider);
            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    if (item.isVoided()) continue;
                    sb.append(truncate(item.getProductName(), 32)).append("\n");
                    sb.append(String.format("  %7.0f x %2.0f = %12.0f\n",
                            item.getUnitPrice(),
                            item.getQuantity(),
                            item.getSubtotal()));
                }
            }
        } else {
            sb.append("MAHSULOT                NARX   DONA     JAMI\n");
            sb.append(divider);
            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    if (item.isVoided()) continue;
                    sb.append(truncate(item.getProductName(), 42)).append("\n");
                    sb.append(String.format("   %8.0f x %2.0f = %18.0f\n",
                            item.getUnitPrice(),
                            item.getQuantity(),
                            item.getSubtotal()));
                }
            }
        }

        BigDecimal subtotal = order.getSubtotal() != null ? order.getSubtotal() : BigDecimal.ZERO;
        BigDecimal discountAmount = order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal discountPercent = order.getDiscountPercent();
        BigDecimal netAmount = subtotal.subtract(discountAmount).max(BigDecimal.ZERO);
        BigDecimal taxAmount = order.getTaxAmount() != null ? order.getTaxAmount() : BigDecimal.ZERO;
        BigDecimal deliveryFee = order.getDeliveryFee() != null ? order.getDeliveryFee() : BigDecimal.ZERO;

        BigDecimal serviceChargeAmount = BigDecimal.ZERO;
        double effectiveServicePercent = serviceChargePercent;

        if (payment != null && payment.getAmount() != null && payment.getAmount().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal paid = payment.getAmount();
            BigDecimal baseTotal = netAmount.add(taxAmount).add(deliveryFee);
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

        BigDecimal finalTotal;
        if (payment != null && payment.getAmount() != null && payment.getAmount().compareTo(BigDecimal.ZERO) > 0) {
            finalTotal = payment.getAmount();
        } else {
            finalTotal = netAmount.add(serviceChargeAmount).add(taxAmount).add(deliveryFee);
        }

        sb.append(divider);
        if (width == 58) {
            sb.append(String.format("JAMI SUMMA:     %11.0f so'm\n", subtotal));
            if (discountAmount.compareTo(BigDecimal.ZERO) > 0 && showDiscount) {
                String pctStr = (discountPercent != null && discountPercent.compareTo(BigDecimal.ZERO) > 0)
                        ? String.format("%.0f%%", discountPercent) : "";
                String lbl = pctStr.isEmpty() ? "CHEGIRMA:" : String.format("CHEGIRMA(%s):", pctStr);
                sb.append(String.format("%-14s%+11.0f so'm\n", lbl, discountAmount.negate()));
            }
            if (serviceChargeAmount.compareTo(BigDecimal.ZERO) > 0 && showServiceCharge) {
                String pctStr = (effectiveServicePercent % 1 == 0)
                        ? String.format("%.0f%%", effectiveServicePercent)
                        : String.format("%.1f%%", effectiveServicePercent);
                String lbl = String.format("XIZMAT(%s):", pctStr);
                sb.append(String.format("%-14s%+11.0f so'm\n", lbl, serviceChargeAmount));
            }
            if (taxAmount.compareTo(BigDecimal.ZERO) > 0 && showTax) {
                sb.append(String.format("%-14s%+11.0f so'm\n", "SOLIQ (QQS):", taxAmount));
            }
            if (deliveryFee.compareTo(BigDecimal.ZERO) > 0) {
                sb.append(String.format("%-14s%+11.0f so'm\n", "YETKAZIB:", deliveryFee));
            }

            sb.append(doubleDivider);
            sb.append(String.format("YAKUNIY SUMMA:  %11.0f so'm\n", finalTotal));

            if (payment != null) {
                String payMethod = payment.getPaymentMethod() != null ? payment.getPaymentMethod().name() : "NAQD";
                if ("CASH".equalsIgnoreCase(payMethod)) payMethod = "NAQD";
                else if ("CARD".equalsIgnoreCase(payMethod)) payMethod = "KARTA";

                sb.append(String.format("TO'LOV TURI:    %11s\n", payMethod));
                sb.append(String.format("TO'LANGAN SUMMA:%11.0f so'm\n", payment.getAmount()));
                if (payment.getChangeAmount() != null && payment.getChangeAmount().compareTo(BigDecimal.ZERO) > 0) {
                    sb.append(String.format("QAYTIM:         %11.0f so'm\n", payment.getChangeAmount()));
                }
            }
        } else {
            // 80mm standard formatting (maxChars = 42)
            sb.append(String.format("JAMI SUMMA:       %12.0f so'm\n", subtotal));
            if (discountAmount.compareTo(BigDecimal.ZERO) > 0 && showDiscount) {
                String pctStr = (discountPercent != null && discountPercent.compareTo(BigDecimal.ZERO) > 0)
                        ? String.format(" (%.0f%%)", discountPercent) : "";
                String lbl = "CHEGIRMA" + pctStr + ":";
                sb.append(String.format("%-18s%+12.0f so'm\n", lbl, discountAmount.negate()));
            }
            if (serviceChargeAmount.compareTo(BigDecimal.ZERO) > 0 && showServiceCharge) {
                String pctStr = (effectiveServicePercent % 1 == 0)
                        ? String.format("%.0f%%", effectiveServicePercent)
                        : String.format("%.1f%%", effectiveServicePercent);
                String lbl = String.format("XIZMAT HAQI (%s):", pctStr);
                sb.append(String.format("%-18s%+12.0f so'm\n", lbl, serviceChargeAmount));
            }
            if (taxAmount.compareTo(BigDecimal.ZERO) > 0 && showTax) {
                sb.append(String.format("%-18s%+12.0f so'm\n", "SOLIQ (QQS):", taxAmount));
            }
            if (deliveryFee.compareTo(BigDecimal.ZERO) > 0) {
                sb.append(String.format("%-18s%+12.0f so'm\n", "YETKAZIB BERISH:", deliveryFee));
            }

            sb.append(doubleDivider);
            sb.append(String.format("YAKUNIY SUMMA:    %12.0f so'm\n", finalTotal));

            if (payment != null) {
                String payMethod = payment.getPaymentMethod() != null ? payment.getPaymentMethod().name() : "NAQD";
                if ("CASH".equalsIgnoreCase(payMethod)) payMethod = "NAQD";
                else if ("CARD".equalsIgnoreCase(payMethod)) payMethod = "KARTA";

                sb.append(String.format("TO'LOV TURI:      %12s\n", payMethod));
                sb.append(String.format("TO'LANGAN SUMMA:  %12.0f so'm\n", payment.getAmount()));
                if (payment.getChangeAmount() != null && payment.getChangeAmount().compareTo(BigDecimal.ZERO) > 0) {
                    sb.append(String.format("QAYTIM:           %12.0f so'm\n", payment.getChangeAmount()));
                }
            }
        }

        sb.append(doubleDivider);
        sb.append(centerText("XARIDINGIZ UCHUN RAHMAT!", maxChars)).append("\n");
        sb.append(centerText("YANA KUTIB QOLAMIZ!", maxChars)).append("\n");
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

    private String centerText(String text, int width) {
        if (text.length() >= width) return text;
        int pad = (width - text.length()) / 2;
        return " ".repeat(pad) + text;
    }

    private String truncate(String text, int max) {
        if (text == null) return "";
        return text.length() <= max ? text : text.substring(0, max);
    }
}
