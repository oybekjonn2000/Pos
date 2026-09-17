package com.restaurantpos.reports;

import com.restaurantpos.inventory.repository.InventoryItemRepository;
import com.restaurantpos.inventory.repository.InventoryTransactionRepository;
import com.restaurantpos.inventory.repository.ProductIngredientRepository;
import com.restaurantpos.kitchen.entity.Kitchen;
import com.restaurantpos.kitchen.repository.KitchenRepository;
import com.restaurantpos.orders.entity.Order;
import com.restaurantpos.orders.entity.OrderItem;
import com.restaurantpos.orders.repository.OrderRepository;
import com.restaurantpos.payments.entity.Payment;
import com.restaurantpos.payments.repository.PaymentRepository;
import com.restaurantpos.products.entity.Product;
import com.restaurantpos.products.repository.ProductRepository;
import com.restaurantpos.reports.dto.ReportDto;
import com.restaurantpos.reports.service.ReportsService;
import com.restaurantpos.shifts.repository.ShiftRepository;
import com.restaurantpos.tenants.entity.Tenant;
import com.restaurantpos.users.entity.User;
import com.restaurantpos.users.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class ReportsFilterTest {

    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private ShiftRepository shiftRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private ProductIngredientRepository productIngredientRepository;
    @Mock
    private KitchenRepository kitchenRepository;
    @Mock
    private InventoryItemRepository inventoryItemRepository;
    @Mock
    private InventoryTransactionRepository inventoryTxRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ReportsService reportsService;

    private UUID tenantId;
    private Kitchen barKitchen;
    private Kitchen pizzaKitchen;
    private User waiter1;
    private User waiter2;

    private Order orderA; // Waiter 1, Bar item (20,000)
    private Order orderB; // Waiter 1, Pizza item (50,000)
    private Order orderC; // Waiter 2, Bar item (30,000)

    private Instant from;
    private Instant to;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        from = Instant.parse("2026-09-17T00:00:00Z");
        to = Instant.parse("2026-09-17T23:59:59Z");

        Tenant tenant = new Tenant();
        tenant.setId(tenantId);

        barKitchen = new Kitchen();
        barKitchen.setId(UUID.fromString("00000000-0000-0000-0000-000000000004"));
        barKitchen.setName("Bar");

        pizzaKitchen = new Kitchen();
        pizzaKitchen.setId(UUID.fromString("00000000-0000-0000-0000-000000000003"));
        pizzaKitchen.setName("Pitsaxona");

        waiter1 = new User();
        waiter1.setId(UUID.fromString("00000000-0000-0000-0000-000000000011"));
        waiter1.setFirstName("Ofitsiant 1");

        waiter2 = new User();
        waiter2.setId(UUID.fromString("00000000-0000-0000-0000-000000000012"));
        waiter2.setFirstName("Ofitsiant 2");

        Product cocktail = new Product();
        cocktail.setId(UUID.randomUUID());
        cocktail.setName("Cocktail");
        cocktail.setKitchen(barKitchen);

        Product pizza = new Product();
        pizza.setId(UUID.randomUUID());
        pizza.setName("Pizza");
        pizza.setKitchen(pizzaKitchen);

        // Order A: Waiter 1, Cocktail (Bar) = 20,000
        orderA = createOrder(tenant, waiter1, from.plusSeconds(3600), "ORD-A");
        OrderItem itemA = createItem(orderA, cocktail, barKitchen, new BigDecimal("1.0"), new BigDecimal("20000.00"));
        orderA.getItems().add(itemA);
        orderA.setTotal(new BigDecimal("20000.00"));

        // Order B: Waiter 1, Pizza (Pitsaxona) = 50,000
        orderB = createOrder(tenant, waiter1, from.plusSeconds(7200), "ORD-B");
        OrderItem itemB = createItem(orderB, pizza, pizzaKitchen, new BigDecimal("1.0"), new BigDecimal("50000.00"));
        orderB.getItems().add(itemB);
        orderB.setTotal(new BigDecimal("50000.00"));

        // Order C: Waiter 2, Cocktail (Bar) = 30,000
        orderC = createOrder(tenant, waiter2, from.plusSeconds(10800), "ORD-C");
        OrderItem itemC = createItem(orderC, cocktail, barKitchen, new BigDecimal("1.5"), new BigDecimal("30000.00"));
        orderC.getItems().add(itemC);
        orderC.setTotal(new BigDecimal("30000.00"));

        Payment payA = createPayment(orderA, new BigDecimal("20000.00"));
        Payment payB = createPayment(orderB, new BigDecimal("50000.00"));
        Payment payC = createPayment(orderC, new BigDecimal("30000.00"));

        when(paymentRepository.findByOrderId(orderA.getId())).thenReturn(List.of(payA));
        when(paymentRepository.findByOrderId(orderB.getId())).thenReturn(List.of(payB));
        when(paymentRepository.findByOrderId(orderC.getId())).thenReturn(List.of(payC));

        // Mock OrderRepository for all orders
        when(orderRepository.findByTenantIdAndStatusAndPaidAtBetweenAndDeletedAtIsNull(eq(tenantId), eq(Order.OrderStatus.PAID), eq(from), eq(to)))
                .thenReturn(List.of(orderA, orderB, orderC));

        // Mock OrderRepository for Waiter 1
        when(orderRepository.findByTenantIdAndStatusAndPaidAtBetweenAndWaiterIdAndDeletedAtIsNull(eq(tenantId), eq(Order.OrderStatus.PAID), eq(from), eq(to), eq(waiter1.getId())))
                .thenReturn(List.of(orderA, orderB));

        // Mock OrderRepository for Waiter 2
        when(orderRepository.findByTenantIdAndStatusAndPaidAtBetweenAndWaiterIdAndDeletedAtIsNull(eq(tenantId), eq(Order.OrderStatus.PAID), eq(from), eq(to), eq(waiter2.getId())))
                .thenReturn(List.of(orderC));

        when(kitchenRepository.findByTenantIdAndDeletedAtIsNullOrderBySortOrderAsc(tenantId))
                .thenReturn(List.of(barKitchen, pizzaKitchen));
    }

    private Order createOrder(Tenant tenant, User waiter, Instant paidAt, String num) {
        Order o = new Order();
        o.setId(UUID.randomUUID());
        o.setTenant(tenant);
        o.setWaiter(waiter);
        o.setPaidAt(paidAt);
        o.setOrderNumber(num);
        o.setStatus(Order.OrderStatus.PAID);
        o.setItems(new ArrayList<>());
        return o;
    }

    private OrderItem createItem(Order order, Product product, Kitchen kitchen, BigDecimal qty, BigDecimal subtotal) {
        OrderItem item = new OrderItem();
        item.setId(UUID.randomUUID());
        item.setOrder(order);
        item.setProduct(product);
        item.setKitchen(kitchen);
        item.setProductName(product.getName());
        item.setQuantity(qty);
        item.setUnitPrice(subtotal.divide(qty, 2, RoundingMode.HALF_UP));
        item.setSubtotal(subtotal);
        item.setKitchenStatus(OrderItem.KitchenStatus.DELIVERED);
        item.setVoided(false);
        return item;
    }

    private Payment createPayment(Order order, BigDecimal amount) {
        Payment p = new Payment();
        p.setId(UUID.randomUUID());
        p.setOrder(order);
        p.setAmount(amount);
        p.setCashAmount(amount);
        p.setPaymentMethod(Payment.PaymentMethod.CASH);
        p.setRefund(false);
        p.setPaidAt(order.getPaidAt());
        return p;
    }

    // ==========================================
    // MANDATORY TEST MATRIX (SECTION 30)
    // ==========================================

    @Test
    void testAllPlusAll_ShouldReturnA_B_C() {
        ReportDto.SalesSummary s = reportsService.getSalesSummary(tenantId, from, to, null, null);
        assertEquals(3, s.getTotalOrders());
        assertEquals(new BigDecimal("100000.00"), s.getTotalSales());
    }

    @Test
    void testBarPlusAll_ShouldReturnA_C() {
        ReportDto.SalesSummary s = reportsService.getSalesSummary(tenantId, from, to, null, barKitchen.getId());
        assertEquals(2, s.getTotalOrders());
        assertEquals(new BigDecimal("50000.00"), s.getTotalSales());
    }

    @Test
    void testPitsaxonaPlusAll_ShouldReturnB() {
        ReportDto.SalesSummary s = reportsService.getSalesSummary(tenantId, from, to, null, pizzaKitchen.getId());
        assertEquals(1, s.getTotalOrders());
        assertEquals(new BigDecimal("50000.00"), s.getTotalSales());
    }

    @Test
    void testAllPlusWaiter1_ShouldReturnA_B() {
        ReportDto.SalesSummary s = reportsService.getSalesSummary(tenantId, from, to, waiter1.getId(), null);
        assertEquals(2, s.getTotalOrders());
        assertEquals(new BigDecimal("70000.00"), s.getTotalSales());
    }

    @Test
    void testAllPlusWaiter2_ShouldReturnC() {
        ReportDto.SalesSummary s = reportsService.getSalesSummary(tenantId, from, to, waiter2.getId(), null);
        assertEquals(1, s.getTotalOrders());
        assertEquals(new BigDecimal("30000.00"), s.getTotalSales());
    }

    @Test
    void testBarPlusWaiter1_ShouldReturnA() {
        ReportDto.SalesSummary s = reportsService.getSalesSummary(tenantId, from, to, waiter1.getId(), barKitchen.getId());
        assertEquals(1, s.getTotalOrders());
        assertEquals(new BigDecimal("20000.00"), s.getTotalSales());
    }

    @Test
    void testBarPlusWaiter2_ShouldReturnC() {
        ReportDto.SalesSummary s = reportsService.getSalesSummary(tenantId, from, to, waiter2.getId(), barKitchen.getId());
        assertEquals(1, s.getTotalOrders());
        assertEquals(new BigDecimal("30000.00"), s.getTotalSales());
    }

    @Test
    void testPitsaxonaPlusWaiter2_ShouldReturnZero() {
        ReportDto.SalesSummary s = reportsService.getSalesSummary(tenantId, from, to, waiter2.getId(), pizzaKitchen.getId());
        assertEquals(0, s.getTotalOrders());
        assertEquals(BigDecimal.ZERO, s.getTotalSales());
    }

    // ==========================================
    // MULTI-KITCHEN ORDER ITEM-LEVEL TEST (SECTION 6)
    // ==========================================

    @Test
    void testMultiKitchenOrder_ItemLevelAggregation() {
        // Order Multi: Waiter 1 has Bar item (10,000) and Pizza item (40,000)
        Product cocktail = orderA.getItems().get(0).getProduct();
        Product pizza = orderB.getItems().get(0).getProduct();

        Tenant tenant = new Tenant();
        tenant.setId(tenantId);

        Order multiOrder = createOrder(tenant, waiter1, from.plusSeconds(14000), "ORD-MULTI");
        OrderItem itemBar = createItem(multiOrder, cocktail, barKitchen, BigDecimal.ONE, new BigDecimal("10000.00"));
        OrderItem itemPizza = createItem(multiOrder, pizza, pizzaKitchen, BigDecimal.ONE, new BigDecimal("40000.00"));
        multiOrder.getItems().add(itemBar);
        multiOrder.getItems().add(itemPizza);
        multiOrder.setTotal(new BigDecimal("50000.00"));

        Payment payMulti = createPayment(multiOrder, new BigDecimal("50000.00"));
        when(paymentRepository.findByOrderId(multiOrder.getId())).thenReturn(List.of(payMulti));

        when(orderRepository.findByTenantIdAndStatusAndPaidAtBetweenAndDeletedAtIsNull(eq(tenantId), eq(Order.OrderStatus.PAID), eq(from), eq(to)))
                .thenReturn(List.of(multiOrder));

        // When filtering Bar: only 10,000 should be counted, NOT 50,000!
        ReportDto.SalesSummary barSummary = reportsService.getSalesSummary(tenantId, from, to, null, barKitchen.getId());
        assertEquals(1, barSummary.getTotalOrders());
        assertEquals(new BigDecimal("10000.00"), barSummary.getTotalSales());

        // When filtering Pitsaxona: only 40,000 should be counted, NOT 50,000!
        ReportDto.SalesSummary pizzaSummary = reportsService.getSalesSummary(tenantId, from, to, null, pizzaKitchen.getId());
        assertEquals(1, pizzaSummary.getTotalOrders());
        assertEquals(new BigDecimal("40000.00"), pizzaSummary.getTotalSales());
    }

    // ==========================================
    // WAITER REPORT WITH KITCHEN FILTER (SECTION 20)
    // ==========================================

    @Test
    void testWaiterReportWithKitchenFilter() {
        // Bar filter on waiter report: Waiter 1 sold 20,000, Waiter 2 sold 30,000
        List<ReportDto.WaiterPerformance> waiters = reportsService.getWaiterReport(tenantId, from, to, null, barKitchen.getId(), null);
        assertEquals(2, waiters.size());

        ReportDto.WaiterPerformance w1 = waiters.stream().filter(w -> w.getWaiterId().equals(waiter1.getId())).findFirst().orElseThrow();
        assertEquals(new BigDecimal("20000.00"), w1.getTotalSales());
        assertEquals(1, w1.getOrdersCount());

        ReportDto.WaiterPerformance w2 = waiters.stream().filter(w -> w.getWaiterId().equals(waiter2.getId())).findFirst().orElseThrow();
        assertEquals(new BigDecimal("30000.00"), w2.getTotalSales());
        assertEquals(1, w2.getOrdersCount());
    }

    // ==========================================
    // KITCHEN REPORT WITH WAITER FILTER (SECTION 21)
    // ==========================================

    @Test
    void testKitchenReportWithWaiterFilter() {
        // Waiter 2 filter on kitchen report: only Bar (30,000), Pitsaxona has 0 orders
        List<ReportDto.KitchenPerformance> kitchens = reportsService.getKitchenReport(tenantId, from, to, null, waiter2.getId(), null);
        assertEquals(2, kitchens.size());

        ReportDto.KitchenPerformance barK = kitchens.stream().filter(k -> k.getKitchenId().equals(barKitchen.getId())).findFirst().orElseThrow();
        assertEquals(new BigDecimal("30000.00"), barK.getRevenue());
        assertEquals(1, barK.getOrdersCount());

        ReportDto.KitchenPerformance pizzaK = kitchens.stream().filter(k -> k.getKitchenId().equals(pizzaKitchen.getId())).findFirst().orElseThrow();
        assertEquals(new BigDecimal("0.00"), pizzaK.getRevenue());
        assertEquals(0, pizzaK.getOrdersCount());
    }

    // ==========================================
    // SECTION 37: EXAMPLE CONSISTENCY TEST
    // ==========================================
    @Test
    void testCrossReportConsistency_ExampleConsistencyTest() {
        // Order #1: Waiter 1, Pizza x2 (40,000 each = 80,000) for Pitsaxona, Burger x1 (30,000) for Bar
        Tenant tenant = new Tenant();
        tenant.setId(tenantId);

        Product pizza = new Product();
        pizza.setId(UUID.randomUUID());
        pizza.setName("Pizza");
        pizza.setKitchen(pizzaKitchen);
        pizza.setPurchasePrice(new BigDecimal("25000.00")); // Cost 25,000

        Product burger = new Product();
        burger.setId(UUID.randomUUID());
        burger.setName("Burger");
        burger.setKitchen(barKitchen);
        burger.setPurchasePrice(new BigDecimal("15000.00")); // Cost 15,000

        Order o1 = createOrder(tenant, waiter1, from.plusSeconds(1000), "ORD-EX-1");
        OrderItem itPizza = createItem(o1, pizza, pizzaKitchen, new BigDecimal("2"), new BigDecimal("80000.00"));
        OrderItem itBurger = createItem(o1, burger, barKitchen, new BigDecimal("1"), new BigDecimal("30000.00"));
        o1.getItems().add(itPizza);
        o1.getItems().add(itBurger);
        o1.setSubtotal(new BigDecimal("110000.00"));
        o1.setTotal(new BigDecimal("110000.00"));

        Payment p1 = createPayment(o1, new BigDecimal("110000.00"));
        p1.setCashier(waiter1);
        p1.setStatus(Payment.PaymentStatus.COMPLETED);

        when(orderRepository.findByTenantIdAndStatusAndPaidAtBetweenAndDeletedAtIsNull(eq(tenantId), eq(Order.OrderStatus.PAID), eq(from), eq(to)))
                .thenReturn(List.of(o1));
        when(orderRepository.findByTenantIdAndStatusAndPaidAtBetweenAndWaiterIdAndDeletedAtIsNull(eq(tenantId), eq(Order.OrderStatus.PAID), eq(from), eq(to), eq(waiter1.getId())))
                .thenReturn(List.of(o1));
        when(paymentRepository.findByOrderId(o1.getId())).thenReturn(List.of(p1));
        when(paymentRepository.findByTenantIdAndPaidAtBetween(eq(tenantId), eq(from), eq(to))).thenReturn(List.of(p1));
        when(productRepository.findById(pizza.getId())).thenReturn(Optional.of(pizza));
        when(productRepository.findById(burger.getId())).thenReturn(Optional.of(burger));
        when(productIngredientRepository.findByProductIdIn(any())).thenReturn(Collections.emptyList());

        // 1. PRODUCT SALES
        List<ReportDto.ProductSaleItem> products = reportsService.getProductSalesReport(tenantId, from, to, null, null, null, null);
        BigDecimal productSalesNetTotal = products.stream().map(ReportDto.ProductSaleItem::getNetRevenue).reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(new BigDecimal("110000.00"), productSalesNetTotal);
        ReportDto.ProductSaleItem pItem = products.stream().filter(p -> p.getProductId().equals(pizza.getId())).findFirst().orElseThrow();
        assertEquals(new BigDecimal("80000.00"), pItem.getNetRevenue());
        assertEquals(new BigDecimal("2"), pItem.getQuantity());
        assertEquals(new BigDecimal("50000.00"), pItem.getCost()); // 2 x 25,000
        assertEquals(new BigDecimal("30000.00"), pItem.getProfit()); // 80,000 - 50,000

        ReportDto.ProductSaleItem bItem = products.stream().filter(p -> p.getProductId().equals(burger.getId())).findFirst().orElseThrow();
        assertEquals(new BigDecimal("30000.00"), bItem.getNetRevenue());
        assertEquals(new BigDecimal("1"), bItem.getQuantity());
        assertEquals(new BigDecimal("15000.00"), bItem.getCost()); // 1 x 15,000
        assertEquals(new BigDecimal("15000.00"), bItem.getProfit()); // 30,000 - 15,000

        // 2. KITCHENS
        List<ReportDto.KitchenPerformance> kitchens = reportsService.getKitchenReport(tenantId, from, to, null, null, null);
        ReportDto.KitchenPerformance kPizza = kitchens.stream().filter(k -> k.getKitchenId().equals(pizzaKitchen.getId())).findFirst().orElseThrow();
        assertEquals(new BigDecimal("80000.00"), kPizza.getRevenue());
        ReportDto.KitchenPerformance kBar = kitchens.stream().filter(k -> k.getKitchenId().equals(barKitchen.getId())).findFirst().orElseThrow();
        assertEquals(new BigDecimal("30000.00"), kBar.getRevenue());
        BigDecimal kitchensTotal = kitchens.stream().map(ReportDto.KitchenPerformance::getRevenue).reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(new BigDecimal("110000.00"), kitchensTotal);

        // 3. WAITER
        List<ReportDto.WaiterPerformance> waiters = reportsService.getWaiterReport(tenantId, from, to, null, null, null);
        assertEquals(1, waiters.size());
        ReportDto.WaiterPerformance w = waiters.get(0);
        assertEquals(new BigDecimal("110000.00"), w.getNetSales());
        assertEquals(1, w.getOrdersCount());
        assertEquals(new BigDecimal("3"), w.getItemsSold()); // 2 pizzas + 1 burger

        // 4. CASHIER
        List<ReportDto.CashierSummary> cashiers = reportsService.getCashierReport(tenantId, from, to, null, null, null);
        assertEquals(1, cashiers.size());
        ReportDto.CashierSummary c = cashiers.get(0);
        assertEquals(new BigDecimal("110000.00"), c.getCashSales());
        assertEquals(new BigDecimal("110000.00"), c.getNetSales());
        assertEquals(1, c.getOrdersCount());

        // 5. P&L
        ReportDto.ProfitLoss pnl = reportsService.getProfitLossReport(tenantId, from, to, null, null, null);
        assertEquals(new BigDecimal("110000.00"), pnl.getTotalRevenue());
        assertEquals(new BigDecimal("65000.00"), pnl.getTotalProductCost()); // 50,000 + 15,000
        assertEquals(new BigDecimal("45000.00"), pnl.getGrossProfit()); // 110,000 - 65,000

        // 6. GENERAL SALES SUMMARY
        ReportDto.SalesSummary summary = reportsService.getSalesSummary(tenantId, from, to, null, null, null);
        assertEquals(new BigDecimal("110000.00"), summary.getTotalSales());
        assertEquals(1, summary.getTotalOrders());
        assertEquals(new BigDecimal("110000.00"), summary.getCashTotal());

        // CROSS-REPORT EQUALITY CONFIRMATION:
        assertEquals(productSalesNetTotal, kitchensTotal);
        assertEquals(productSalesNetTotal, w.getNetSales());
        assertEquals(productSalesNetTotal, c.getNetSales());
        assertEquals(productSalesNetTotal, pnl.getTotalRevenue());
        assertEquals(productSalesNetTotal, summary.getTotalSales());
    }

    // ==========================================
    // SECTION 38 & 39: SECOND TEST - MULTIPLE KITCHEN FILTER
    // ==========================================
    @Test
    void testSecondTest_MultipleKitchenFilter() {
        // Pizza x2 = 80,000 (Pitsaxona)
        // Burger x1 = 30,000 (Bar)
        // Somsa x3 = 45,000 (Somsapaz)
        Tenant tenant = new Tenant();
        tenant.setId(tenantId);

        Kitchen somsaKitchen = new Kitchen();
        somsaKitchen.setId(UUID.fromString("00000000-0000-0000-0000-000000000005"));
        somsaKitchen.setName("Somsapaz");

        Product pizza = new Product();
        pizza.setId(UUID.randomUUID());
        pizza.setName("Pizza");
        pizza.setKitchen(pizzaKitchen);

        Product burger = new Product();
        burger.setId(UUID.randomUUID());
        burger.setName("Burger");
        burger.setKitchen(barKitchen);

        Product somsa = new Product();
        somsa.setId(UUID.randomUUID());
        somsa.setName("Somsa");
        somsa.setKitchen(somsaKitchen);

        Order o2 = createOrder(tenant, waiter1, from.plusSeconds(2000), "ORD-EX-2");
        OrderItem itPizza = createItem(o2, pizza, pizzaKitchen, new BigDecimal("2"), new BigDecimal("80000.00"));
        OrderItem itBurger = createItem(o2, burger, barKitchen, new BigDecimal("1"), new BigDecimal("30000.00"));
        OrderItem itSomsa = createItem(o2, somsa, somsaKitchen, new BigDecimal("3"), new BigDecimal("45000.00"));
        o2.getItems().addAll(List.of(itPizza, itBurger, itSomsa));
        o2.setSubtotal(new BigDecimal("155000.00"));
        o2.setTotal(new BigDecimal("155000.00"));

        Payment p2 = createPayment(o2, new BigDecimal("155000.00"));
        p2.setCashier(waiter1);
        p2.setStatus(Payment.PaymentStatus.COMPLETED);

        when(orderRepository.findByTenantIdAndStatusAndPaidAtBetweenAndDeletedAtIsNull(eq(tenantId), eq(Order.OrderStatus.PAID), eq(from), eq(to)))
                .thenReturn(List.of(o2));
        when(orderRepository.findByTenantIdAndStatusAndPaidAtBetweenAndWaiterIdAndDeletedAtIsNull(eq(tenantId), eq(Order.OrderStatus.PAID), eq(from), eq(to), eq(waiter1.getId())))
                .thenReturn(List.of(o2));
        when(paymentRepository.findByOrderId(o2.getId())).thenReturn(List.of(p2));
        when(paymentRepository.findByTenantIdAndPaidAtBetween(eq(tenantId), eq(from), eq(to))).thenReturn(List.of(p2));
        when(kitchenRepository.findByTenantIdAndDeletedAtIsNullOrderBySortOrderAsc(tenantId))
                .thenReturn(List.of(barKitchen, pizzaKitchen, somsaKitchen));

        // When Filter = Bar:
        // Burger = 30,000 must be counted. Pitsaxona (80,000) and Somsapaz (45,000) MUST NOT be counted!
        ReportDto.SalesSummary barSummary = reportsService.getSalesSummary(tenantId, from, to, null, barKitchen.getId(), null);
        assertEquals(new BigDecimal("30000.00"), barSummary.getTotalSales());
        assertEquals(1, barSummary.getTotalOrders());

        List<ReportDto.ProductSaleItem> barProducts = reportsService.getProductSalesReport(tenantId, from, to, null, barKitchen.getId(), null, null);
        assertEquals(1, barProducts.size());
        assertEquals(new BigDecimal("30000.00"), barProducts.get(0).getNetRevenue());
        assertEquals("Burger", barProducts.get(0).getProductName());

        List<ReportDto.WaiterPerformance> barWaiters = reportsService.getWaiterReport(tenantId, from, to, null, barKitchen.getId(), null);
        assertEquals(1, barWaiters.size());
        assertEquals(new BigDecimal("30000.00"), barWaiters.get(0).getNetSales());
        assertEquals(1, barWaiters.get(0).getOrdersCount());

        List<ReportDto.CashierSummary> barCashiers = reportsService.getCashierReport(tenantId, from, to, null, barKitchen.getId(), null);
        assertEquals(1, barCashiers.size());
        assertEquals(new BigDecimal("30000.00"), barCashiers.get(0).getCashSales());
        assertEquals(new BigDecimal("30000.00"), barCashiers.get(0).getNetSales());
    }
}
