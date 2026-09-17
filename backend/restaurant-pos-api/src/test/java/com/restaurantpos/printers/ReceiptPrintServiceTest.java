package com.restaurantpos.printers;

import com.restaurantpos.orders.entity.Order;
import com.restaurantpos.orders.entity.OrderItem;
import com.restaurantpos.payments.entity.Payment;
import com.restaurantpos.printers.entity.Printer;
import com.restaurantpos.printers.service.ReceiptPrintService;
import com.restaurantpos.printers.service.WindowsPrintService;
import com.restaurantpos.settings.entity.AppSetting;
import com.restaurantpos.settings.repository.AppSettingRepository;
import com.restaurantpos.tenants.entity.Tenant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class ReceiptPrintServiceTest {

    @Mock
    private WindowsPrintService windowsPrintService;

    @Mock
    private AppSettingRepository appSettingRepository;

    @InjectMocks
    private ReceiptPrintService receiptPrintService;

    private Tenant tenant;
    private Printer printer;
    private Order order;
    private Payment payment;

    @BeforeEach
    void setUp() {
        tenant = new Tenant();
        tenant.setId(UUID.randomUUID());
        tenant.setName("OYBEK RESTAURANT & LOUNGE");

        printer = new Printer();
        printer.setName("Cashier Thermal Printer");
        printer.setWindowsPrinterName("XP-80");
        printer.setPaperWidth(80);
        printer.setStatus(Printer.PrinterStatus.ONLINE);

        order = new Order();
        order.setTenant(tenant);
        order.setOrderNumber("ORD-20260914-0101");
        order.setSubtotal(BigDecimal.valueOf(16000));
        order.setTotal(BigDecimal.valueOf(17600));

        OrderItem item = new OrderItem();
        item.setProductName("Ko'k Choy (Choynak)");
        item.setQuantity(BigDecimal.valueOf(2));
        item.setUnitPrice(BigDecimal.valueOf(8000));
        item.setSubtotal(BigDecimal.valueOf(16000));
        order.setItems(List.of(item));

        payment = new Payment();
        payment.setPaymentNumber("PAY-20260917-1059");
        payment.setPaymentMethod(Payment.PaymentMethod.CASH);
        payment.setAmount(BigDecimal.valueOf(17600));
        payment.setChangeAmount(BigDecimal.ZERO);
    }

    @Test
    void testPrintReceiptContainsServiceChargeAndPercentage() {
        AppSetting enabledSetting = new AppSetting();
        enabledSetting.setValue("true");
        when(appSettingRepository.findByTenantIdAndCategoryAndKey(any(), eq("TAX_SERVICE"), eq("serviceChargeEnabled")))
                .thenReturn(Optional.of(enabledSetting));

        AppSetting percentSetting = new AppSetting();
        percentSetting.setValue("10.0");
        when(appSettingRepository.findByTenantIdAndCategoryAndKey(any(), eq("TAX_SERVICE"), eq("serviceChargePercent")))
                .thenReturn(Optional.of(percentSetting));

        AppSetting showSetting = new AppSetting();
        showSetting.setValue("true");
        when(appSettingRepository.findByTenantIdAndCategoryAndKey(any(), eq("RECEIPT"), eq("showServiceCharge")))
                .thenReturn(Optional.of(showSetting));

        receiptPrintService.printReceipt(printer, order, payment, false);

        ArgumentCaptor<String> textCaptor = ArgumentCaptor.forClass(String.class);
        verify(windowsPrintService).print(eq("XP-80"), any(byte[].class), textCaptor.capture());

        String receiptText = textCaptor.getValue();
        System.out.println("=== GENERATED RECEIPT ===");
        System.out.println(receiptText);
        System.out.println("=========================");

        assertTrue(receiptText.contains("JAMI SUMMA:"), "Receipt must contain JAMI SUMMA");
        assertTrue(receiptText.contains("16000 so'm"), "Receipt must contain 16000 so'm");
        assertTrue(receiptText.contains("XIZMAT HAQI (10%):"), "Receipt must contain XIZMAT HAQI (10%)");
        assertTrue(receiptText.contains("+1600 so'm"), "Receipt must contain +1600 so'm");
        assertTrue(receiptText.contains("YAKUNIY SUMMA:"), "Receipt must contain YAKUNIY SUMMA");
        assertTrue(receiptText.contains("17600 so'm"), "Receipt must contain 17600 so'm");
        assertTrue(receiptText.contains("TO'LANGAN SUMMA:"), "Receipt must contain TO'LANGAN SUMMA");
    }

    @Test
    void testPrintReceipt58mmWithDiscount() {
        printer.setPaperWidth(58);
        order.setDiscountAmount(BigDecimal.valueOf(1000));
        order.setDiscountPercent(BigDecimal.valueOf(6.25));
        payment.setAmount(BigDecimal.valueOf(16500));

        receiptPrintService.printReceipt(printer, order, payment, false);

        ArgumentCaptor<String> textCaptor = ArgumentCaptor.forClass(String.class);
        verify(windowsPrintService).print(eq("XP-80"), any(byte[].class), textCaptor.capture());

        String receiptText = textCaptor.getValue();
        System.out.println("=== 58MM RECEIPT ===");
        System.out.println(receiptText);
        System.out.println("====================");

        assertTrue(receiptText.contains("JAMI SUMMA:"));
        assertTrue(receiptText.contains("CHEGIRMA(6%):"));
        assertTrue(receiptText.contains("XIZMAT(10%):"));
        assertTrue(receiptText.contains("YAKUNIY SUMMA:"));
        assertTrue(receiptText.contains("16500 so'm"));
    }
}
