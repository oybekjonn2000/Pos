package com.restaurantpos.reports.service;

import com.restaurantpos.auth.security.UserPrincipal;
import com.restaurantpos.inventory.entity.InventoryItem;
import com.restaurantpos.inventory.entity.InventoryTransaction;
import com.restaurantpos.inventory.entity.ProductIngredient;
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
import com.restaurantpos.shifts.entity.Shift;
import com.restaurantpos.shifts.repository.ShiftRepository;
import com.restaurantpos.users.entity.User;
import com.restaurantpos.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportsService {

    private final PaymentRepository paymentRepository;
    private final ShiftRepository shiftRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ProductIngredientRepository productIngredientRepository;
    private final KitchenRepository kitchenRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final InventoryTransactionRepository inventoryTxRepository;
    private final UserRepository userRepository;

    private static final ZoneId TASHKENT_ZONE = ZoneId.of("Asia/Tashkent");

    // ==========================================
    // HELPER METHODS FOR KITCHEN RESOLUTION
    // ==========================================
    // ==========================================
    // HELPER METHODS FOR KITCHEN RESOLUTION
    // ==========================================
    public static UUID resolveKitchenId(OrderItem item) {
        if (item == null) return null;
        if (item.getKitchen() != null) {
            return item.getKitchen().getId();
        }
        if (item.getProduct() != null) {
            if (item.getProduct().getKitchen() != null) {
                return item.getProduct().getKitchen().getId();
            }
            if (item.getProduct().getCategory() != null && item.getProduct().getCategory().getKitchen() != null) {
                return item.getProduct().getCategory().getKitchen().getId();
            }
        }
        return null;
    }

    public static Kitchen resolveKitchen(OrderItem item) {
        if (item == null) return null;
        if (item.getKitchen() != null) {
            return item.getKitchen();
        }
        if (item.getProduct() != null) {
            if (item.getProduct().getKitchen() != null) {
                return item.getProduct().getKitchen();
            }
            if (item.getProduct().getCategory() != null && item.getProduct().getCategory().getKitchen() != null) {
                return item.getProduct().getCategory().getKitchen();
            }
        }
        return null;
    }

    public static String resolveKitchenName(OrderItem item) {
        Kitchen k = resolveKitchen(item);
        if (k != null && k.getName() != null && !k.getName().isBlank()) {
            return k.getName();
        }
        return "Boshqa";
    }

    public static boolean matchesKitchen(OrderItem item, UUID kitchenId) {
        if (kitchenId == null) return true;
        UUID resolved = resolveKitchenId(item);
        return kitchenId.equals(resolved);
    }

    // ==========================================
    // 1. SAVDO HISOBOTI (SALES SUMMARY)
    // ==========================================
    @Transactional(readOnly = true)
    public ReportDto.SalesSummary getSalesSummary(UUID tenantId, Instant from, Instant to, UUID waiterId, UUID kitchenId) {
        return getSalesSummary(tenantId, from, to, waiterId, kitchenId, null);
    }

    @Transactional(readOnly = true)
    public ReportDto.SalesSummary getSalesSummary(UUID tenantId, Instant from, Instant to, UUID waiterId, UUID kitchenId, UserPrincipal principal) {
        UUID effectiveWaiterId = waiterId;
        if (principal != null && principal.isWaiter()) {
            effectiveWaiterId = principal.getUserId();
        }

        List<Order> paidOrders = effectiveWaiterId != null
                ? orderRepository.findByTenantIdAndStatusAndPaidAtBetweenAndWaiterIdAndDeletedAtIsNull(tenantId, Order.OrderStatus.PAID, from, to, effectiveWaiterId)
                : orderRepository.findByTenantIdAndStatusAndPaidAtBetweenAndDeletedAtIsNull(tenantId, Order.OrderStatus.PAID, from, to);

        BigDecimal cashTotal = BigDecimal.ZERO;
        BigDecimal cardTotal = BigDecimal.ZERO;
        BigDecimal otherTotal = BigDecimal.ZERO;
        BigDecimal totalSales = BigDecimal.ZERO;
        Set<UUID> paidOrderIds = new HashSet<>();

        // Hourly breakdown (0..23)
        Map<Integer, BigDecimal> hourlyRevMap = new HashMap<>();
        Map<Integer, Long> hourlyOrderCount = new HashMap<>();
        for (int h = 0; h < 24; h++) {
            hourlyRevMap.put(h, BigDecimal.ZERO);
            hourlyOrderCount.put(h, 0L);
        }

        // Daily trend
        Map<String, BigDecimal> dailyRevMap = new TreeMap<>();
        Map<String, Long> dailyOrderCount = new TreeMap<>();
        DateTimeFormatter df = DateTimeFormatter.ofPattern("yyyy-MM-dd").withZone(TASHKENT_ZONE);

        for (Order o : paidOrders) {
            if (o.getItems() == null || o.getItems().isEmpty()) continue;

            BigDecimal orderGrossSubtotal = BigDecimal.ZERO;
            for (OrderItem item : o.getItems()) {
                if (item.isVoided()) continue;
                BigDecimal qty = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO;
                if (item.getCancelledQuantity() != null) qty = qty.subtract(item.getCancelledQuantity()).max(BigDecimal.ZERO);
                BigDecimal unitPrice = item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO;
                orderGrossSubtotal = orderGrossSubtotal.add(unitPrice.multiply(qty).setScale(2, RoundingMode.HALF_UP));
            }

            BigDecimal orderKitchenNet = BigDecimal.ZERO;
            BigDecimal orderTotalNet = BigDecimal.ZERO;
            boolean hasMatchingItem = false;

            for (OrderItem item : o.getItems()) {
                if (item.isVoided()) continue;
                BigDecimal qty = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO;
                if (item.getCancelledQuantity() != null) qty = qty.subtract(item.getCancelledQuantity()).max(BigDecimal.ZERO);
                if (qty.compareTo(BigDecimal.ZERO) <= 0) continue;

                BigDecimal unitPrice = item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO;
                BigDecimal gross = unitPrice.multiply(qty).setScale(2, RoundingMode.HALF_UP);

                BigDecimal itemDisc = item.getDiscountAmount() != null ? item.getDiscountAmount() : BigDecimal.ZERO;
                BigDecimal orderDiscShare = BigDecimal.ZERO;
                if (o.getDiscountAmount() != null && o.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0 && orderGrossSubtotal.compareTo(BigDecimal.ZERO) > 0) {
                    orderDiscShare = o.getDiscountAmount().multiply(gross).divide(orderGrossSubtotal, 2, RoundingMode.HALF_UP);
                }
                BigDecimal totalDisc = itemDisc.add(orderDiscShare);
                BigDecimal net = gross.subtract(totalDisc).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

                orderTotalNet = orderTotalNet.add(net);

                if (matchesKitchen(item, kitchenId)) {
                    hasMatchingItem = true;
                    orderKitchenNet = orderKitchenNet.add(net);
                }
            }

            if (!hasMatchingItem) continue;

            paidOrderIds.add(o.getId());

            BigDecimal effectiveOrderSales;
            if (kitchenId == null) {
                effectiveOrderSales = orderTotalNet.setScale(2, RoundingMode.HALF_UP);
            } else {
                effectiveOrderSales = orderKitchenNet.setScale(2, RoundingMode.HALF_UP);
            }

            totalSales = totalSales.add(effectiveOrderSales);

            // Payments breakdown for this order
            List<Payment> orderPayments = paymentRepository.findByOrderId(o.getId());
            if (orderPayments.isEmpty()) {
                cashTotal = cashTotal.add(effectiveOrderSales);
            } else {
                for (Payment p : orderPayments) {
                    if (p.isRefund()) continue;
                    if (p.getStatus() != Payment.PaymentStatus.COMPLETED) continue;

                    BigDecimal amt = p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO;
                    BigDecimal cash = p.getCashAmount() != null ? p.getCashAmount() : BigDecimal.ZERO;
                    BigDecimal card = p.getCardAmount() != null ? p.getCardAmount() : BigDecimal.ZERO;
                    BigDecimal other = p.getOtherAmount() != null ? p.getOtherAmount() : BigDecimal.ZERO;

                    if (p.getPaymentMethod() == Payment.PaymentMethod.CASH && cash.compareTo(BigDecimal.ZERO) == 0 && card.compareTo(BigDecimal.ZERO) == 0) {
                        cash = amt;
                    } else if (p.getPaymentMethod() == Payment.PaymentMethod.CARD && card.compareTo(BigDecimal.ZERO) == 0 && cash.compareTo(BigDecimal.ZERO) == 0) {
                        card = amt;
                    } else if ((p.getPaymentMethod() == Payment.PaymentMethod.OTHER || p.getPaymentMethod() == Payment.PaymentMethod.DEBT) && other.compareTo(BigDecimal.ZERO) == 0 && cash.compareTo(BigDecimal.ZERO) == 0 && card.compareTo(BigDecimal.ZERO) == 0) {
                        other = amt;
                    } else if (p.getPaymentMethod() == Payment.PaymentMethod.MIXED) {
                        other = amt.subtract(cash).subtract(card).max(BigDecimal.ZERO);
                    }

                    if (kitchenId == null || orderTotalNet.compareTo(BigDecimal.ZERO) <= 0) {
                        cashTotal = cashTotal.add(cash.setScale(2, RoundingMode.HALF_UP));
                        cardTotal = cardTotal.add(card.setScale(2, RoundingMode.HALF_UP));
                        otherTotal = otherTotal.add(other.setScale(2, RoundingMode.HALF_UP));
                    } else {
                        BigDecimal pCash = cash.multiply(orderKitchenNet).divide(orderTotalNet, 2, RoundingMode.HALF_UP);
                        BigDecimal pCard = card.multiply(orderKitchenNet).divide(orderTotalNet, 2, RoundingMode.HALF_UP);
                        BigDecimal pOther = effectiveOrderSales.subtract(pCash).subtract(pCard).max(BigDecimal.ZERO);

                        cashTotal = cashTotal.add(pCash);
                        cardTotal = cardTotal.add(pCard);
                        otherTotal = otherTotal.add(pOther);
                    }
                }
            }

            // Hourly and daily aggregation
            Instant orderTime = o.getPaidAt() != null ? o.getPaidAt() : o.getOpenedAt();
            if (orderTime != null) {
                int hour = orderTime.atZone(TASHKENT_ZONE).getHour();
                hourlyRevMap.put(hour, hourlyRevMap.get(hour).add(effectiveOrderSales));
                hourlyOrderCount.put(hour, hourlyOrderCount.get(hour) + 1);

                String dayKey = df.format(orderTime);
                dailyRevMap.put(dayKey, dailyRevMap.getOrDefault(dayKey, BigDecimal.ZERO).add(effectiveOrderSales));
                dailyOrderCount.put(dayKey, dailyOrderCount.getOrDefault(dayKey, 0L) + 1);
            }
        }

        // Cancelled orders:
        List<Order> cancelledOrders = effectiveWaiterId != null
                ? orderRepository.findByTenantIdAndStatusAndClosedAtBetweenAndWaiterIdAndDeletedAtIsNull(tenantId, Order.OrderStatus.CANCELLED, from, to, effectiveWaiterId)
                : orderRepository.findByTenantIdAndStatusAndClosedAtBetweenAndDeletedAtIsNull(tenantId, Order.OrderStatus.CANCELLED, from, to);

        long cancelledOrdersCount = 0;
        for (Order co : cancelledOrders) {
            if (kitchenId == null) {
                cancelledOrdersCount++;
            } else if (co.getItems() != null) {
                boolean hasKitchen = co.getItems().stream().anyMatch(it -> matchesKitchen(it, kitchenId));
                if (hasKitchen) cancelledOrdersCount++;
            }
        }

        // Refunded payments
        List<Payment> refunds = paymentRepository.findByTenantIdAndPaidAtBetweenAndRefundTrue(tenantId, from, to);
        BigDecimal refundedAmount = BigDecimal.ZERO;
        long refundedOrdersCount = 0;

        for (Payment ref : refunds) {
            Order ro = ref.getOrder();
            if (ro != null) {
                if (effectiveWaiterId != null && (ro.getWaiter() == null || !effectiveWaiterId.equals(ro.getWaiter().getId()))) {
                    continue;
                }
                if (kitchenId != null) {
                    if (ro.getItems() == null) continue;
                    BigDecimal kSub = BigDecimal.ZERO;
                    BigDecimal totSub = BigDecimal.ZERO;
                    for (OrderItem item : ro.getItems()) {
                        if (item.isVoided()) continue;
                        BigDecimal q = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ONE;
                        if (item.getCancelledQuantity() != null) q = q.subtract(item.getCancelledQuantity()).max(BigDecimal.ZERO);
                        BigDecimal sub = item.getUnitPrice() != null ? item.getUnitPrice().multiply(q) : BigDecimal.ZERO;
                        totSub = totSub.add(sub);
                        if (matchesKitchen(item, kitchenId)) {
                            kSub = kSub.add(sub);
                        }
                    }
                    if (kSub.compareTo(BigDecimal.ZERO) <= 0) continue;
                    BigDecimal refAmt = totSub.compareTo(BigDecimal.ZERO) > 0
                            ? ref.getAmount().abs().multiply(kSub).divide(totSub, 2, RoundingMode.HALF_UP)
                            : ref.getAmount().abs();
                    refundedAmount = refundedAmount.add(refAmt);
                    refundedOrdersCount++;
                } else {
                    refundedAmount = refundedAmount.add(ref.getAmount().abs().setScale(2, RoundingMode.HALF_UP));
                    refundedOrdersCount++;
                }
            } else if (effectiveWaiterId == null && kitchenId == null) {
                refundedAmount = refundedAmount.add(ref.getAmount().abs().setScale(2, RoundingMode.HALF_UP));
                refundedOrdersCount++;
            }
        }

        long totalOrders = paidOrderIds.size();
        BigDecimal totalPayments = totalSales.subtract(refundedAmount);
        BigDecimal avgCheck = totalOrders > 0
                ? totalSales.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        List<ReportDto.HourlySales> hourlySales = new ArrayList<>();
        for (int h = 0; h < 24; h++) {
            hourlySales.add(ReportDto.HourlySales.builder()
                    .hour(h)
                    .orders(hourlyOrderCount.get(h))
                    .revenue(hourlyRevMap.get(h))
                    .build());
        }

        List<ReportDto.DailyTrend> dailyTrend = dailyRevMap.entrySet().stream()
                .map(e -> ReportDto.DailyTrend.builder()
                        .date(e.getKey())
                        .revenue(e.getValue())
                        .orders(dailyOrderCount.getOrDefault(e.getKey(), 0L))
                        .build())
                .collect(Collectors.toList());

        return ReportDto.SalesSummary.builder()
                .totalSales(totalSales)
                .totalOrders(totalOrders)
                .totalPayments(totalPayments)
                .avgCheck(avgCheck)
                .cashTotal(cashTotal)
                .cardTotal(cardTotal)
                .otherTotal(otherTotal)
                .cancelledOrdersCount(cancelledOrdersCount)
                .refundedOrdersCount(refundedOrdersCount)
                .refundedAmount(refundedAmount)
                .hourlySales(hourlySales)
                .dailyTrend(dailyTrend)
                .build();
    }

    // ==========================================
    // 2. MAHSULOT SAVDO HISOBOTI (PRODUCT SALES)
    // ==========================================
    @Transactional(readOnly = true)
    public List<ReportDto.ProductSaleItem> getProductSalesReport(UUID tenantId, Instant from, Instant to, UUID categoryId, UUID kitchenId) {
        return getProductSalesReport(tenantId, from, to, categoryId, kitchenId, null, null);
    }

    @Transactional(readOnly = true)
    public List<ReportDto.ProductSaleItem> getProductSalesReport(UUID tenantId, Instant from, Instant to, UUID categoryId, UUID kitchenId, UUID waiterId, UserPrincipal principal) {
        UUID effectiveWaiterId = waiterId;
        if (principal != null && principal.isWaiter()) {
            effectiveWaiterId = principal.getUserId();
        }

        List<Order> paidOrders = effectiveWaiterId != null
                ? orderRepository.findByTenantIdAndStatusAndPaidAtBetweenAndWaiterIdAndDeletedAtIsNull(tenantId, Order.OrderStatus.PAID, from, to, effectiveWaiterId)
                : orderRepository.findByTenantIdAndStatusAndPaidAtBetweenAndDeletedAtIsNull(tenantId, Order.OrderStatus.PAID, from, to);

        Set<UUID> soldProductIds = new HashSet<>();
        List<OrderItemMatch> matchingItems = new ArrayList<>();

        for (Order o : paidOrders) {
            if (o.getItems() == null || o.getItems().isEmpty()) continue;

            BigDecimal orderGrossSubtotal = BigDecimal.ZERO;
            for (OrderItem item : o.getItems()) {
                if (item.isVoided()) continue;
                BigDecimal qty = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO;
                if (item.getCancelledQuantity() != null) qty = qty.subtract(item.getCancelledQuantity()).max(BigDecimal.ZERO);
                BigDecimal unitPrice = item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO;
                orderGrossSubtotal = orderGrossSubtotal.add(unitPrice.multiply(qty));
            }

            for (OrderItem item : o.getItems()) {
                if (item.isVoided()) continue;
                Product prod = item.getProduct();

                if (categoryId != null && (prod == null || prod.getCategory() == null || !categoryId.equals(prod.getCategory().getId()))) {
                    continue;
                }
                if (kitchenId != null && !matchesKitchen(item, kitchenId)) {
                    continue;
                }

                BigDecimal qty = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO;
                if (item.getCancelledQuantity() != null) {
                    qty = qty.subtract(item.getCancelledQuantity()).max(BigDecimal.ZERO);
                }
                if (qty.compareTo(BigDecimal.ZERO) <= 0) continue;

                // Snapshot historical price from OrderItem
                BigDecimal unitPrice = item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO;
                BigDecimal gross = unitPrice.multiply(qty).setScale(2, RoundingMode.HALF_UP);

                BigDecimal itemDisc = item.getDiscountAmount() != null ? item.getDiscountAmount() : BigDecimal.ZERO;
                BigDecimal orderDiscShare = BigDecimal.ZERO;
                if (o.getDiscountAmount() != null && o.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0 && orderGrossSubtotal.compareTo(BigDecimal.ZERO) > 0) {
                    orderDiscShare = o.getDiscountAmount().multiply(gross).divide(orderGrossSubtotal, 2, RoundingMode.HALF_UP);
                }
                BigDecimal totalDisc = itemDisc.add(orderDiscShare).setScale(2, RoundingMode.HALF_UP);
                BigDecimal net = gross.subtract(totalDisc).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

                if (prod != null) {
                    soldProductIds.add(prod.getId());
                }

                matchingItems.add(new OrderItemMatch(item, prod, qty, unitPrice, gross, totalDisc, net));
            }
        }

        // Batch load ingredients for sold products
        Map<UUID, List<ProductIngredient>> ingredientsByProduct = new HashMap<>();
        if (!soldProductIds.isEmpty()) {
            List<ProductIngredient> ingredients = productIngredientRepository.findByProductIdIn(soldProductIds);
            for (ProductIngredient pi : ingredients) {
                if (pi.getProduct() != null) {
                    ingredientsByProduct.computeIfAbsent(pi.getProduct().getId(), k -> new ArrayList<>()).add(pi);
                }
            }
        }

        Map<UUID, CostInfo> costMap = new HashMap<>();
        for (UUID pId : soldProductIds) {
            List<ProductIngredient> ingList = ingredientsByProduct.get(pId);
            BigDecimal recipeCost = BigDecimal.ZERO;
            if (ingList != null && !ingList.isEmpty()) {
                for (ProductIngredient ing : ingList) {
                    if (ing.getInventoryItem() != null && ing.getInventoryItem().getCostPrice() != null) {
                        recipeCost = recipeCost.add(ing.getQuantity().multiply(ing.getInventoryItem().getCostPrice()));
                    }
                }
            }

            if (recipeCost.compareTo(BigDecimal.ZERO) > 0) {
                costMap.put(pId, new CostInfo(recipeCost, true));
            } else {
                Product p = productRepository.findById(pId).orElse(null);
                if (p != null && p.getPurchasePrice() != null && p.getPurchasePrice().compareTo(BigDecimal.ZERO) > 0) {
                    costMap.put(pId, new CostInfo(p.getPurchasePrice(), true));
                } else {
                    costMap.put(pId, new CostInfo(BigDecimal.ZERO, false));
                }
            }
        }

        // Group by product id to prevent duplicate lines for same product
        Map<UUID, ProductSalesAgg> aggMap = new LinkedHashMap<>();
        for (OrderItemMatch m : matchingItems) {
            UUID pId = m.product != null ? m.product.getId() : UUID.nameUUIDFromBytes(m.item.getProductName().getBytes());
            String pName = m.item.getProductName() != null ? m.item.getProductName() : (m.product != null ? m.product.getName() : "Noma'lum");
            String catName = m.product != null && m.product.getCategory() != null ? m.product.getCategory().getName() : "Boshqa";
            String kName = resolveKitchenName(m.item);
            CostInfo costInfo = m.product != null ? costMap.getOrDefault(m.product.getId(), new CostInfo(BigDecimal.ZERO, false)) : new CostInfo(BigDecimal.ZERO, false);

            ProductSalesAgg agg = aggMap.computeIfAbsent(pId, k -> new ProductSalesAgg(pId, pName, catName, kName, costInfo.unitCost, costInfo.hasCostData));
            agg.quantity = agg.quantity.add(m.qty);
            agg.grossRevenue = agg.grossRevenue.add(m.gross);
            agg.discount = agg.discount.add(m.discount);
            agg.netRevenue = agg.netRevenue.add(m.net);
        }

        List<ReportDto.ProductSaleItem> result = new ArrayList<>();
        for (ProductSalesAgg a : aggMap.values()) {
            BigDecimal totalCost = a.unitCost.multiply(a.quantity).setScale(2, RoundingMode.HALF_UP);
            BigDecimal profit = a.netRevenue.subtract(totalCost);
            BigDecimal margin = a.netRevenue.compareTo(BigDecimal.ZERO) > 0 && a.hasCostData
                    ? profit.divide(a.netRevenue, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                    : BigDecimal.ZERO;

            result.add(ReportDto.ProductSaleItem.builder()
                    .productId(a.productId)
                    .productName(a.productName)
                    .categoryName(a.categoryName)
                    .kitchenName(a.kitchenName)
                    .quantity(a.quantity)
                    .grossRevenue(a.grossRevenue)
                    .discount(a.discount)
                    .netRevenue(a.netRevenue)
                    .revenue(a.netRevenue)
                    .cost(totalCost)
                    .profit(profit)
                    .profitMargin(margin)
                    .hasCostData(a.hasCostData)
                    .build());
        }

        result.sort((a, b) -> b.getQuantity().compareTo(a.getQuantity()));
        return result;
    }

    // ==========================================
    // 3. FOYDA HISOBOTI (PROFIT & LOSS)
    // ==========================================
    @Transactional(readOnly = true)
    public ReportDto.ProfitLoss getProfitLossReport(UUID tenantId, Instant from, Instant to) {
        return getProfitLossReport(tenantId, from, to, null, null, null);
    }

    @Transactional(readOnly = true)
    public ReportDto.ProfitLoss getProfitLossReport(UUID tenantId, Instant from, Instant to, UUID waiterId, UUID kitchenId, UserPrincipal principal) {
        UUID effectiveWaiterId = waiterId;
        if (principal != null && principal.isWaiter()) {
            effectiveWaiterId = principal.getUserId();
        }

        List<ReportDto.ProductSaleItem> productSales = getProductSalesReport(tenantId, from, to, null, kitchenId, effectiveWaiterId, principal);

        BigDecimal totalGross = BigDecimal.ZERO;
        BigDecimal totalDiscounts = BigDecimal.ZERO;
        BigDecimal totalNetRevenue = BigDecimal.ZERO;
        BigDecimal totalProductCost = BigDecimal.ZERO;

        for (ReportDto.ProductSaleItem p : productSales) {
            totalGross = totalGross.add(p.getGrossRevenue() != null ? p.getGrossRevenue() : BigDecimal.ZERO);
            totalDiscounts = totalDiscounts.add(p.getDiscount() != null ? p.getDiscount() : BigDecimal.ZERO);
            totalNetRevenue = totalNetRevenue.add(p.getNetRevenue() != null ? p.getNetRevenue() : p.getRevenue());
            totalProductCost = totalProductCost.add(p.getCost() != null ? p.getCost() : BigDecimal.ZERO);
        }

        // Refunds within the filter context
        List<Payment> refunds = paymentRepository.findByTenantIdAndPaidAtBetweenAndRefundTrue(tenantId, from, to);
        BigDecimal totalRefunds = BigDecimal.ZERO;
        for (Payment ref : refunds) {
            Order ro = ref.getOrder();
            if (ro != null) {
                if (effectiveWaiterId != null && (ro.getWaiter() == null || !effectiveWaiterId.equals(ro.getWaiter().getId()))) {
                    continue;
                }
                if (kitchenId != null) {
                    if (ro.getItems() == null) continue;
                    BigDecimal kSub = BigDecimal.ZERO;
                    BigDecimal totSub = BigDecimal.ZERO;
                    for (OrderItem item : ro.getItems()) {
                        if (item.isVoided()) continue;
                        BigDecimal qty = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO;
                        if (item.getCancelledQuantity() != null) qty = qty.subtract(item.getCancelledQuantity()).max(BigDecimal.ZERO);
                        BigDecimal sub = item.getUnitPrice() != null ? item.getUnitPrice().multiply(qty) : BigDecimal.ZERO;
                        totSub = totSub.add(sub);
                        if (matchesKitchen(item, kitchenId)) {
                            kSub = kSub.add(sub);
                        }
                    }
                    if (kSub.compareTo(BigDecimal.ZERO) <= 0) continue;
                    BigDecimal refAmt = totSub.compareTo(BigDecimal.ZERO) > 0
                            ? ref.getAmount().abs().multiply(kSub).divide(totSub, 2, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO;
                    totalRefunds = totalRefunds.add(refAmt);
                } else {
                    totalRefunds = totalRefunds.add(ref.getAmount().abs().setScale(2, RoundingMode.HALF_UP));
                }
            } else if (effectiveWaiterId == null && kitchenId == null) {
                totalRefunds = totalRefunds.add(ref.getAmount().abs().setScale(2, RoundingMode.HALF_UP));
            }
        }

        BigDecimal grossProfit = totalNetRevenue.subtract(totalProductCost).subtract(totalRefunds).setScale(2, RoundingMode.HALF_UP);
        BigDecimal profitMargin = totalNetRevenue.compareTo(BigDecimal.ZERO) > 0
                ? grossProfit.divide(totalNetRevenue, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return ReportDto.ProfitLoss.builder()
                .totalRevenue(totalNetRevenue.setScale(2, RoundingMode.HALF_UP))
                .totalProductCost(totalProductCost.setScale(2, RoundingMode.HALF_UP))
                .totalDiscounts(totalDiscounts.setScale(2, RoundingMode.HALF_UP))
                .totalRefunds(totalRefunds.setScale(2, RoundingMode.HALF_UP))
                .grossProfit(grossProfit)
                .profitMargin(profitMargin)
                .build();
    }

    // ==========================================
    // 4. KASSA HISOBOTI (CASHIER SUMMARY)
    // ==========================================
    @Transactional(readOnly = true)
    public List<ReportDto.CashierSummary> getCashierReport(UUID tenantId, Instant from, Instant to) {
        return getCashierReport(tenantId, from, to, null, null, null);
    }

    @Transactional(readOnly = true)
    public List<ReportDto.CashierSummary> getCashierReport(UUID tenantId, Instant from, Instant to, UUID waiterId, UUID kitchenId, UserPrincipal principal) {
        UUID effectiveWaiterId = waiterId;
        if (principal != null && principal.isWaiter()) {
            effectiveWaiterId = principal.getUserId();
        }

        List<Payment> payments = paymentRepository.findByTenantIdAndPaidAtBetween(tenantId, from, to);
        Map<UUID, CashierAgg> map = new HashMap<>();

        for (Payment p : payments) {
            if (!p.isRefund() && p.getStatus() != Payment.PaymentStatus.COMPLETED) {
                continue;
            }
            if (p.isRefund() && p.getStatus() != Payment.PaymentStatus.REFUNDED && p.getStatus() != Payment.PaymentStatus.COMPLETED) {
                continue;
            }

            Order o = p.getOrder();
            if (o != null) {
                if (o.getStatus() == Order.OrderStatus.CANCELLED) {
                    continue;
                }
                if (effectiveWaiterId != null && (o.getWaiter() == null || !effectiveWaiterId.equals(o.getWaiter().getId()))) {
                    continue;
                }

                BigDecimal kSub = BigDecimal.ZERO;
                BigDecimal totSub = BigDecimal.ZERO;
                if (kitchenId != null) {
                    if (o.getItems() == null || o.getItems().isEmpty()) continue;
                    for (OrderItem it : o.getItems()) {
                        if (it.isVoided()) continue;
                        BigDecimal qty = it.getQuantity() != null ? it.getQuantity() : BigDecimal.ZERO;
                        if (it.getCancelledQuantity() != null) qty = qty.subtract(it.getCancelledQuantity()).max(BigDecimal.ZERO);
                        BigDecimal sub = it.getUnitPrice() != null ? it.getUnitPrice().multiply(qty).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
                        totSub = totSub.add(sub);
                        if (matchesKitchen(it, kitchenId)) {
                            kSub = kSub.add(sub);
                        }
                    }
                    if (kSub.compareTo(BigDecimal.ZERO) <= 0) continue;
                }

                User c = p.getCashier();
                UUID cId = c != null ? c.getId() : UUID.fromString("00000000-0000-0000-0000-000000000000");
                String cName = c != null ? c.getFirstName() + " " + (c.getLastName() != null ? c.getLastName() : "") : "Noma'lum kassa";

                CashierAgg agg = map.computeIfAbsent(cId, k -> new CashierAgg(cId, cName));

                if (p.isRefund()) {
                    BigDecimal refAmt = (kitchenId == null || totSub.compareTo(BigDecimal.ZERO) <= 0)
                            ? p.getAmount().abs().setScale(2, RoundingMode.HALF_UP)
                            : p.getAmount().abs().multiply(kSub).divide(totSub, 2, RoundingMode.HALF_UP);
                    agg.totalRefunds = agg.totalRefunds.add(refAmt);
                } else {
                    BigDecimal amt = p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO;
                    BigDecimal cash = p.getCashAmount() != null ? p.getCashAmount() : BigDecimal.ZERO;
                    BigDecimal card = p.getCardAmount() != null ? p.getCardAmount() : BigDecimal.ZERO;
                    BigDecimal other = p.getOtherAmount() != null ? p.getOtherAmount() : BigDecimal.ZERO;

                    if (p.getPaymentMethod() == Payment.PaymentMethod.CASH && cash.compareTo(BigDecimal.ZERO) == 0 && card.compareTo(BigDecimal.ZERO) == 0) {
                        cash = amt;
                    } else if (p.getPaymentMethod() == Payment.PaymentMethod.CARD && card.compareTo(BigDecimal.ZERO) == 0 && cash.compareTo(BigDecimal.ZERO) == 0) {
                        card = amt;
                    } else if ((p.getPaymentMethod() == Payment.PaymentMethod.OTHER || p.getPaymentMethod() == Payment.PaymentMethod.DEBT) && other.compareTo(BigDecimal.ZERO) == 0 && cash.compareTo(BigDecimal.ZERO) == 0 && card.compareTo(BigDecimal.ZERO) == 0) {
                        other = amt;
                    } else if (p.getPaymentMethod() == Payment.PaymentMethod.MIXED) {
                        other = amt.subtract(cash).subtract(card).max(BigDecimal.ZERO);
                    }

                    BigDecimal effectiveAmt;
                    BigDecimal effectiveCash;
                    BigDecimal effectiveCard;
                    BigDecimal effectiveOther;

                    if (kitchenId == null || totSub.compareTo(BigDecimal.ZERO) <= 0) {
                        effectiveAmt = amt.setScale(2, RoundingMode.HALF_UP);
                        effectiveCash = cash.setScale(2, RoundingMode.HALF_UP);
                        effectiveCard = card.setScale(2, RoundingMode.HALF_UP);
                        effectiveOther = other.setScale(2, RoundingMode.HALF_UP);
                    } else {
                        effectiveAmt = amt.multiply(kSub).divide(totSub, 2, RoundingMode.HALF_UP);
                        effectiveCash = cash.multiply(kSub).divide(totSub, 2, RoundingMode.HALF_UP);
                        effectiveCard = card.multiply(kSub).divide(totSub, 2, RoundingMode.HALF_UP);
                        effectiveOther = effectiveAmt.subtract(effectiveCash).subtract(effectiveCard).max(BigDecimal.ZERO);
                    }

                    agg.cashSales = agg.cashSales.add(effectiveCash);
                    agg.cardSales = agg.cardSales.add(effectiveCard);
                    agg.otherSales = agg.otherSales.add(effectiveOther);
                    agg.totalSales = agg.totalSales.add(effectiveAmt);
                    agg.orderIds.add(o.getId());
                }
            }
        }

        return map.values().stream().map(a -> {
            BigDecimal netSales = a.totalSales.subtract(a.totalRefunds);
            return ReportDto.CashierSummary.builder()
                    .cashierId(a.cashierId)
                    .cashierName(a.cashierName)
                    .ordersCount(a.orderIds.size())
                    .cashSales(a.cashSales)
                    .cardSales(a.cardSales)
                    .onlineSales(BigDecimal.ZERO)
                    .otherSales(a.otherSales)
                    .totalSales(a.totalSales)
                    .totalRefunds(a.totalRefunds)
                    .netSales(netSales)
                    .build();
        }).collect(Collectors.toList());
    }

    // ==========================================
    // 5. OFITSIANT HISOBOTI (WAITER PERFORMANCE)
    // ==========================================
    @Transactional(readOnly = true)
    public List<ReportDto.WaiterPerformance> getWaiterReport(UUID tenantId, Instant from, Instant to, UUID filterWaiterId, UserPrincipal principal) {
        return getWaiterReport(tenantId, from, to, filterWaiterId, null, principal);
    }

    @Transactional(readOnly = true)
    public List<ReportDto.WaiterPerformance> getWaiterReport(UUID tenantId, Instant from, Instant to, UUID filterWaiterId, UUID kitchenId, UserPrincipal principal) {
        UUID targetWaiterId = filterWaiterId;
        if (principal != null && principal.isWaiter()) {
            targetWaiterId = principal.getUserId();
        }

        List<Order> paidOrders = targetWaiterId != null
                ? orderRepository.findByTenantIdAndStatusAndPaidAtBetweenAndWaiterIdAndDeletedAtIsNull(tenantId, Order.OrderStatus.PAID, from, to, targetWaiterId)
                : orderRepository.findByTenantIdAndStatusAndPaidAtBetweenAndDeletedAtIsNull(tenantId, Order.OrderStatus.PAID, from, to);

        Map<UUID, WaiterAgg> map = new HashMap<>();

        for (Order o : paidOrders) {
            if (o.getItems() == null || o.getItems().isEmpty()) continue;

            BigDecimal orderGrossSubtotal = BigDecimal.ZERO;
            for (OrderItem item : o.getItems()) {
                if (item.isVoided()) continue;
                BigDecimal qty = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO;
                if (item.getCancelledQuantity() != null) qty = qty.subtract(item.getCancelledQuantity()).max(BigDecimal.ZERO);
                BigDecimal unitPrice = item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO;
                orderGrossSubtotal = orderGrossSubtotal.add(unitPrice.multiply(qty));
            }

            BigDecimal waiterKitchenGross = BigDecimal.ZERO;
            BigDecimal waiterKitchenDiscount = BigDecimal.ZERO;
            BigDecimal waiterKitchenNet = BigDecimal.ZERO;
            BigDecimal waiterItemsSold = BigDecimal.ZERO;
            long deliveredCount = 0;
            long cancelledCount = 0;
            boolean hasKitchenItem = false;

            for (OrderItem item : o.getItems()) {
                if (matchesKitchen(item, kitchenId)) {
                    hasKitchenItem = true;
                    if (item.isVoided()) {
                        cancelledCount++;
                    } else {
                        BigDecimal qty = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO;
                        if (item.getCancelledQuantity() != null) {
                            qty = qty.subtract(item.getCancelledQuantity()).max(BigDecimal.ZERO);
                        }
                        if (qty.compareTo(BigDecimal.ZERO) <= 0) continue;

                        BigDecimal unitPrice = item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO;
                        BigDecimal gross = unitPrice.multiply(qty).setScale(2, RoundingMode.HALF_UP);

                        BigDecimal itemDisc = item.getDiscountAmount() != null ? item.getDiscountAmount() : BigDecimal.ZERO;
                        BigDecimal orderDiscShare = BigDecimal.ZERO;
                        if (o.getDiscountAmount() != null && o.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0 && orderGrossSubtotal.compareTo(BigDecimal.ZERO) > 0) {
                            orderDiscShare = o.getDiscountAmount().multiply(gross).divide(orderGrossSubtotal, 2, RoundingMode.HALF_UP);
                        }
                        BigDecimal totalDisc = itemDisc.add(orderDiscShare).setScale(2, RoundingMode.HALF_UP);
                        BigDecimal net = gross.subtract(totalDisc).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

                        waiterKitchenGross = waiterKitchenGross.add(gross);
                        waiterKitchenDiscount = waiterKitchenDiscount.add(totalDisc);
                        waiterKitchenNet = waiterKitchenNet.add(net);
                        waiterItemsSold = waiterItemsSold.add(qty);

                        if (item.getKitchenStatus() == OrderItem.KitchenStatus.DELIVERED || item.getKitchenStatus() == OrderItem.KitchenStatus.SERVED) {
                            deliveredCount++;
                        }
                    }
                }
            }

            if (!hasKitchenItem) continue;

            User w = o.getWaiter();
            UUID wId = w != null ? w.getId() : UUID.fromString("00000000-0000-0000-0000-000000000000");
            String wName = w != null ? w.getFirstName() + " " + (w.getLastName() != null ? w.getLastName() : "") : "Noma'lum ofitsiant";

            WaiterAgg agg = map.computeIfAbsent(wId, k -> new WaiterAgg(wId, wName));
            agg.orderIds.add(o.getId());
            agg.grossSales = agg.grossSales.add(waiterKitchenGross);
            agg.discountAmount = agg.discountAmount.add(waiterKitchenDiscount);
            agg.netSales = agg.netSales.add(waiterKitchenNet);
            agg.itemsSold = agg.itemsSold.add(waiterItemsSold);
            agg.deliveredCount += deliveredCount;
            agg.cancelledCount += cancelledCount;
        }

        // Prorated refunds for each waiter
        List<Payment> refunds = paymentRepository.findByTenantIdAndPaidAtBetweenAndRefundTrue(tenantId, from, to);
        for (Payment ref : refunds) {
            Order ro = ref.getOrder();
            if (ro != null && ro.getWaiter() != null && map.containsKey(ro.getWaiter().getId())) {
                UUID wId = ro.getWaiter().getId();
                BigDecimal refAmt = ref.getAmount().abs().setScale(2, RoundingMode.HALF_UP);
                if (kitchenId != null) {
                    BigDecimal kSub = BigDecimal.ZERO;
                    BigDecimal totSub = BigDecimal.ZERO;
                    for (OrderItem it : ro.getItems()) {
                        if (it.isVoided()) continue;
                        BigDecimal q = it.getQuantity() != null ? it.getQuantity() : BigDecimal.ONE;
                        if (it.getCancelledQuantity() != null) q = q.subtract(it.getCancelledQuantity()).max(BigDecimal.ZERO);
                        BigDecimal sub = it.getUnitPrice() != null ? it.getUnitPrice().multiply(q).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
                        totSub = totSub.add(sub);
                        if (matchesKitchen(it, kitchenId)) kSub = kSub.add(sub);
                    }
                    if (kSub.compareTo(BigDecimal.ZERO) <= 0) continue;
                    refAmt = totSub.compareTo(BigDecimal.ZERO) > 0
                            ? ref.getAmount().abs().multiply(kSub).divide(totSub, 2, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO;
                }
                map.get(wId).refundAmount = map.get(wId).refundAmount.add(refAmt);
                map.get(wId).netSales = map.get(wId).netSales.subtract(refAmt).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
            }
        }

        return map.values().stream().map(a -> {
            long uniqueOrders = a.orderIds.size();
            BigDecimal avg = uniqueOrders > 0
                    ? a.netSales.divide(BigDecimal.valueOf(uniqueOrders), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            return ReportDto.WaiterPerformance.builder()
                    .waiterId(a.waiterId)
                    .waiterName(a.waiterName)
                    .ordersCount(uniqueOrders)
                    .itemsSold(a.itemsSold)
                    .grossSales(a.grossSales.setScale(2, RoundingMode.HALF_UP))
                    .discountAmount(a.discountAmount.setScale(2, RoundingMode.HALF_UP))
                    .refundAmount(a.refundAmount.setScale(2, RoundingMode.HALF_UP))
                    .netSales(a.netSales.setScale(2, RoundingMode.HALF_UP))
                    .totalSales(a.netSales.setScale(2, RoundingMode.HALF_UP))
                    .paymentTotal(a.netSales.setScale(2, RoundingMode.HALF_UP))
                    .avgCheck(avg.setScale(2, RoundingMode.HALF_UP))
                    .deliveredCount(a.deliveredCount)
                    .cancelledCount(a.cancelledCount)
                    .build();
        }).collect(Collectors.toList());
    }

    // ==========================================
    // 6. OSHXONA HISOBOTI (KITCHEN PERFORMANCE)
    // ==========================================
    @Transactional(readOnly = true)
    public List<ReportDto.KitchenPerformance> getKitchenReport(UUID tenantId, Instant from, Instant to, UUID filterKitchenId) {
        return getKitchenReport(tenantId, from, to, filterKitchenId, null, null);
    }

    @Transactional(readOnly = true)
    public List<ReportDto.KitchenPerformance> getKitchenReport(UUID tenantId, Instant from, Instant to, UUID filterKitchenId, UUID waiterId, UserPrincipal principal) {
        UUID effectiveWaiterId = waiterId;
        if (principal != null && principal.isWaiter()) {
            effectiveWaiterId = principal.getUserId();
        }

        List<Kitchen> kitchens = kitchenRepository.findByTenantIdAndDeletedAtIsNullOrderBySortOrderAsc(tenantId);
        if (filterKitchenId != null) {
            kitchens = kitchens.stream().filter(k -> filterKitchenId.equals(k.getId())).collect(Collectors.toList());
        }

        List<Order> paidOrders = effectiveWaiterId != null
                ? orderRepository.findByTenantIdAndStatusAndPaidAtBetweenAndWaiterIdAndDeletedAtIsNull(tenantId, Order.OrderStatus.PAID, from, to, effectiveWaiterId)
                : orderRepository.findByTenantIdAndStatusAndPaidAtBetweenAndDeletedAtIsNull(tenantId, Order.OrderStatus.PAID, from, to);

        Map<UUID, KitchenAgg> map = new LinkedHashMap<>();
        for (Kitchen k : kitchens) {
            map.put(k.getId(), new KitchenAgg(k.getId(), k.getName()));
        }

        for (Order o : paidOrders) {
            if (o.getItems() == null || o.getItems().isEmpty()) continue;

            BigDecimal orderGrossSubtotal = BigDecimal.ZERO;
            for (OrderItem item : o.getItems()) {
                if (item.isVoided()) continue;
                BigDecimal qty = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO;
                if (item.getCancelledQuantity() != null) qty = qty.subtract(item.getCancelledQuantity()).max(BigDecimal.ZERO);
                BigDecimal unitPrice = item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO;
                orderGrossSubtotal = orderGrossSubtotal.add(unitPrice.multiply(qty));
            }

            for (OrderItem item : o.getItems()) {
                UUID kId = resolveKitchenId(item);
                if (kId == null || !map.containsKey(kId)) {
                    if (filterKitchenId != null && (kId == null || !kId.equals(filterKitchenId))) {
                        continue;
                    }
                    Kitchen resolvedK = resolveKitchen(item);
                    String kName = resolvedK != null ? resolvedK.getName() : resolveKitchenName(item);
                    if (kId == null) {
                        kId = UUID.fromString("00000000-0000-0000-0000-000000000000");
                    }
                    map.putIfAbsent(kId, new KitchenAgg(kId, kName));
                }

                KitchenAgg agg = map.get(kId);

                BigDecimal qty = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO;
                BigDecimal cancelled = item.getCancelledQuantity() != null ? item.getCancelledQuantity() : BigDecimal.ZERO;
                BigDecimal effectiveQty = qty.subtract(cancelled).max(BigDecimal.ZERO);
                BigDecimal unitPrice = item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO;
                BigDecimal gross = unitPrice.multiply(effectiveQty).setScale(2, RoundingMode.HALF_UP);

                BigDecimal itemDisc = item.getDiscountAmount() != null ? item.getDiscountAmount() : BigDecimal.ZERO;
                BigDecimal orderDiscShare = BigDecimal.ZERO;
                if (o.getDiscountAmount() != null && o.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0 && orderGrossSubtotal.compareTo(BigDecimal.ZERO) > 0) {
                    orderDiscShare = o.getDiscountAmount().multiply(gross).divide(orderGrossSubtotal, 2, RoundingMode.HALF_UP);
                }
                BigDecimal totalDisc = itemDisc.add(orderDiscShare).setScale(2, RoundingMode.HALF_UP);
                BigDecimal net = gross.subtract(totalDisc).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

                if (item.isVoided()) {
                    agg.itemsCancelled = agg.itemsCancelled.add(qty);
                } else {
                    agg.orderIds.add(o.getId());
                    if (item.getProduct() != null) {
                        agg.distinctProductIds.add(item.getProduct().getId());
                    } else if (item.getProductName() != null) {
                        agg.distinctProductIds.add(UUID.nameUUIDFromBytes(item.getProductName().getBytes()));
                    }
                    agg.itemsPrepared = agg.itemsPrepared.add(effectiveQty);
                    agg.itemsCancelled = agg.itemsCancelled.add(cancelled);
                    agg.sales = agg.sales.add(gross);
                    agg.revenue = agg.revenue.add(net);
                }
            }
        }

        return map.values().stream().map(a -> {
            long uniqueOrders = a.orderIds.size();
            BigDecimal avg = uniqueOrders > 0
                    ? a.revenue.divide(BigDecimal.valueOf(uniqueOrders), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            return ReportDto.KitchenPerformance.builder()
                    .kitchenId(a.kitchenId)
                    .kitchenName(a.kitchenName)
                    .ordersCount(uniqueOrders)
                    .totalQuantity(a.itemsPrepared)
                    .itemsPrepared(a.itemsPrepared)
                    .itemsCancelled(a.itemsCancelled)
                    .productCount(a.distinctProductIds.size())
                    .avgOrderValue(avg.setScale(2, RoundingMode.HALF_UP))
                    .sales(a.sales.setScale(2, RoundingMode.HALF_UP))
                    .revenue(a.revenue.setScale(2, RoundingMode.HALF_UP))
                    .build();
        }).collect(Collectors.toList());
    }

    // ==========================================
    // INNER HELPER AGGREGATORS & DATA HOLDERS
    // ==========================================
    @lombok.Getter
    private static class CostInfo {
        final BigDecimal unitCost;
        final boolean hasCostData;
        CostInfo(BigDecimal unitCost, boolean hasCostData) {
            this.unitCost = unitCost != null ? unitCost : BigDecimal.ZERO;
            this.hasCostData = hasCostData;
        }
    }

    private static class OrderItemMatch {
        final OrderItem item;
        final Product product;
        final BigDecimal qty;
        final BigDecimal unitPrice;
        final BigDecimal gross;
        final BigDecimal discount;
        final BigDecimal net;

        OrderItemMatch(OrderItem item, Product product, BigDecimal qty, BigDecimal unitPrice, BigDecimal gross, BigDecimal discount, BigDecimal net) {
            this.item = item;
            this.product = product;
            this.qty = qty;
            this.unitPrice = unitPrice;
            this.gross = gross;
            this.discount = discount;
            this.net = net;
        }
    }

    private static class ProductSalesAgg {
        final UUID productId;
        final String productName;
        final String categoryName;
        final String kitchenName;
        final BigDecimal unitCost;
        final boolean hasCostData;
        BigDecimal quantity = BigDecimal.ZERO;
        BigDecimal grossRevenue = BigDecimal.ZERO;
        BigDecimal discount = BigDecimal.ZERO;
        BigDecimal netRevenue = BigDecimal.ZERO;

        ProductSalesAgg(UUID productId, String productName, String categoryName, String kitchenName, BigDecimal unitCost, boolean hasCostData) {
            this.productId = productId;
            this.productName = productName;
            this.categoryName = categoryName;
            this.kitchenName = kitchenName;
            this.unitCost = unitCost != null ? unitCost : BigDecimal.ZERO;
            this.hasCostData = hasCostData;
        }
    }

    private static class CashierAgg {
        final UUID cashierId;
        final String cashierName;
        final Set<UUID> orderIds = new HashSet<>();
        BigDecimal cashSales = BigDecimal.ZERO;
        BigDecimal cardSales = BigDecimal.ZERO;
        BigDecimal otherSales = BigDecimal.ZERO;
        BigDecimal totalSales = BigDecimal.ZERO;
        BigDecimal totalRefunds = BigDecimal.ZERO;

        CashierAgg(UUID cashierId, String cashierName) {
            this.cashierId = cashierId;
            this.cashierName = cashierName;
        }
    }

    private static class WaiterAgg {
        final UUID waiterId;
        final String waiterName;
        final Set<UUID> orderIds = new HashSet<>();
        BigDecimal itemsSold = BigDecimal.ZERO;
        BigDecimal grossSales = BigDecimal.ZERO;
        BigDecimal discountAmount = BigDecimal.ZERO;
        BigDecimal refundAmount = BigDecimal.ZERO;
        BigDecimal netSales = BigDecimal.ZERO;
        long deliveredCount = 0;
        long cancelledCount = 0;

        WaiterAgg(UUID waiterId, String waiterName) {
            this.waiterId = waiterId;
            this.waiterName = waiterName;
        }
    }

    private static class KitchenAgg {
        final UUID kitchenId;
        final String kitchenName;
        final Set<UUID> orderIds = new HashSet<>();
        final Set<UUID> distinctProductIds = new HashSet<>();
        BigDecimal itemsPrepared = BigDecimal.ZERO;
        BigDecimal itemsCancelled = BigDecimal.ZERO;
        BigDecimal sales = BigDecimal.ZERO;
        BigDecimal revenue = BigDecimal.ZERO;

        KitchenAgg(UUID kitchenId, String kitchenName) {
            this.kitchenId = kitchenId;
            this.kitchenName = kitchenName;
        }
    }

    // ==========================================
    // 7. STOCK REPORT (OMBOR HARAKATI / BALANCE)
    // ==========================================
    @Transactional(readOnly = true)
    public List<ReportDto.StockReportItem> getStockReport(UUID tenantId, Instant from, Instant to, UUID warehouseId) {
        List<InventoryItem> items = warehouseId != null
                ? inventoryItemRepository.findByTenantIdAndWarehouseIdAndDeletedAtIsNullOrderByNameAsc(tenantId, warehouseId)
                : inventoryItemRepository.findByTenantIdAndDeletedAtIsNullOrderByNameAsc(tenantId);

        List<ReportDto.StockReportItem> result = new ArrayList<>();

        for (InventoryItem item : items) {
            List<InventoryTransaction> allTxs = inventoryTxRepository.findByItemIdOrderByCreatedAtDesc(item.getId(), org.springframework.data.domain.Pageable.unpaged());

            BigDecimal openingStock = BigDecimal.ZERO;
            BigDecimal incoming = BigDecimal.ZERO;
            BigDecimal outgoing = BigDecimal.ZERO;
            BigDecimal salesConsumption = BigDecimal.ZERO;
            BigDecimal waste = BigDecimal.ZERO;
            BigDecimal adjustment = BigDecimal.ZERO;

            for (InventoryTransaction tx : allTxs) {
                Instant txTime = tx.getCreatedAt();
                BigDecimal qty = tx.getQuantity() != null ? tx.getQuantity() : BigDecimal.ZERO;

                if (txTime.isBefore(from)) {
                    openingStock = openingStock.add(qty);
                } else if (!txTime.isAfter(to)) {
                    if (tx.getType() == InventoryTransaction.TransactionType.PURCHASE || tx.getType() == InventoryTransaction.TransactionType.IN) {
                        incoming = incoming.add(qty.abs());
                    } else if (tx.getType() == InventoryTransaction.TransactionType.OUT) {
                        outgoing = outgoing.add(qty.abs());
                    } else if (tx.getType() == InventoryTransaction.TransactionType.SALE) {
                        salesConsumption = salesConsumption.add(qty.abs());
                    } else if (tx.getType() == InventoryTransaction.TransactionType.WASTE) {
                        waste = waste.add(qty.abs());
                    } else if (tx.getType() == InventoryTransaction.TransactionType.ADJUSTMENT) {
                        adjustment = adjustment.add(qty);
                    }
                }
            }

            // Formula: Closing Stock = Opening Stock + Incoming - Outgoing - Sales Consumption - Waste +/- Adjustment
            BigDecimal closingStock = openingStock.add(incoming).subtract(outgoing).subtract(salesConsumption).subtract(waste).add(adjustment);
            // Agar tranzaksiyalardan oldingi stock 0 bo'lsa, joriy item qoldig'i bilan solishtirish
            if (allTxs.isEmpty()) {
                closingStock = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO;
                openingStock = closingStock;
            }

            BigDecimal unitCost = item.getCostPrice() != null ? item.getCostPrice() : BigDecimal.ZERO;
            BigDecimal valuation = closingStock.multiply(unitCost);

            result.add(ReportDto.StockReportItem.builder()
                    .itemId(item.getId())
                    .itemName(item.getName())
                    .unit(item.getUnit())
                    .category(item.getCategory() != null ? item.getCategory() : "Umumiy")
                    .warehouseName(item.getWarehouse() != null ? item.getWarehouse().getName() : "Asosiy ombor")
                    .openingStock(openingStock)
                    .incoming(incoming)
                    .outgoing(outgoing)
                    .salesConsumption(salesConsumption)
                    .waste(waste)
                    .adjustment(adjustment)
                    .closingStock(closingStock)
                    .unitCost(unitCost)
                    .totalValuation(valuation)
                    .build());
        }

        return result;
    }

    // ==========================================
    // 8. CSV EXPORT
    // ==========================================
    @Transactional(readOnly = true)
    public String exportToCsv(String reportType, UUID tenantId, Instant from, Instant to, UUID waiterId, UUID kitchenId, UUID warehouseId, UserPrincipal principal) {
        StringBuilder csv = new StringBuilder();
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm").withZone(TASHKENT_ZONE);

        csv.append("Oybek Restaurant POS - Hisobot\n");
        csv.append("Hisobot turi:,").append(reportType).append("\n");
        csv.append("Davr:,").append(dtf.format(from)).append(" - ").append(dtf.format(to)).append("\n");
        csv.append("Yaratilgan vaqt:,").append(dtf.format(Instant.now())).append("\n");
        csv.append("Yaratuvchi:,").append(principal != null ? principal.getFullName() : "Admin").append("\n\n");

        if ("PRODUCTS".equalsIgnoreCase(reportType)) {
            csv.append("Mahsulot,Kategoriya,Oshxona,Sotilgan miqdor,Yalpi tushum,Chegirma,Sof tushum,Tannarx,Foyda,Marja %\n");
            List<ReportDto.ProductSaleItem> items = getProductSalesReport(tenantId, from, to, null, kitchenId, waiterId, principal);
            for (ReportDto.ProductSaleItem i : items) {
                csv.append(escape(i.getProductName())).append(",")
                        .append(escape(i.getCategoryName())).append(",")
                        .append(escape(i.getKitchenName())).append(",")
                        .append(i.getQuantity()).append(",")
                        .append(i.getGrossRevenue()).append(",")
                        .append(i.getDiscount()).append(",")
                        .append(i.getNetRevenue()).append(",")
                        .append(i.isHasCostData() ? i.getCost() : "Mavjud emas").append(",")
                        .append(i.isHasCostData() ? i.getProfit() : "Mavjud emas").append(",")
                        .append(i.isHasCostData() ? i.getProfitMargin() + "%" : "Mavjud emas").append("\n");
            }
        } else if ("STOCK".equalsIgnoreCase(reportType)) {
            csv.append("Mahsulot,Birlik,Ombor,Boshlang'ich qoldiq,Kirim,Chiqim,Sotuv sarfi,Isrof,Tuzatish,Yakuniy qoldiq,Tannarx,Ombor qiymati\n");
            List<ReportDto.StockReportItem> items = getStockReport(tenantId, from, to, warehouseId);
            for (ReportDto.StockReportItem i : items) {
                csv.append(escape(i.getItemName())).append(",")
                        .append(i.getUnit()).append(",")
                        .append(escape(i.getWarehouseName())).append(",")
                        .append(i.getOpeningStock()).append(",")
                        .append(i.getIncoming()).append(",")
                        .append(i.getOutgoing()).append(",")
                        .append(i.getSalesConsumption()).append(",")
                        .append(i.getWaste()).append(",")
                        .append(i.getAdjustment()).append(",")
                        .append(i.getClosingStock()).append(",")
                        .append(i.getUnitCost()).append(",")
                        .append(i.getTotalValuation()).append("\n");
            }
        } else if ("WAITERS".equalsIgnoreCase(reportType)) {
            csv.append("Ofitsiant,Buyurtmalar soni,Sotilgan taomlar,Yalpi savdo,Chegirma,Qaytarish,Sof savdo,O'rtacha chek,Yetkazilgan,Bekor qilingan\n");
            List<ReportDto.WaiterPerformance> items = getWaiterReport(tenantId, from, to, waiterId, kitchenId, principal);
            for (ReportDto.WaiterPerformance i : items) {
                csv.append(escape(i.getWaiterName())).append(",")
                        .append(i.getOrdersCount()).append(",")
                        .append(i.getItemsSold()).append(",")
                        .append(i.getGrossSales()).append(",")
                        .append(i.getDiscountAmount()).append(",")
                        .append(i.getRefundAmount()).append(",")
                        .append(i.getNetSales()).append(",")
                        .append(i.getAvgCheck()).append(",")
                        .append(i.getDeliveredCount()).append(",")
                        .append(i.getCancelledCount()).append("\n");
            }
        } else if ("KITCHEN".equalsIgnoreCase(reportType)) {
            csv.append("Oshxona,Buyurtmalar soni,Taomlar miqdori,Mahsulotlar soni,Yalpi savdo,Tushum,O'rtacha buyurtma qiymati,Bekor qilingan\n");
            List<ReportDto.KitchenPerformance> items = getKitchenReport(tenantId, from, to, kitchenId, waiterId, principal);
            for (ReportDto.KitchenPerformance i : items) {
                csv.append(escape(i.getKitchenName())).append(",")
                        .append(i.getOrdersCount()).append(",")
                        .append(i.getTotalQuantity()).append(",")
                        .append(i.getProductCount()).append(",")
                        .append(i.getSales()).append(",")
                        .append(i.getRevenue()).append(",")
                        .append(i.getAvgOrderValue()).append(",")
                        .append(i.getItemsCancelled()).append("\n");
            }
        } else if ("CASHIER".equalsIgnoreCase(reportType)) {
            csv.append("Kassir,Buyurtmalar soni,Naqd savdo,Karta savdo,Boshqa to'lov,Jami savdo,Qaytarilgan summa,Sof tushum\n");
            List<ReportDto.CashierSummary> items = getCashierReport(tenantId, from, to, waiterId, kitchenId, principal);
            for (ReportDto.CashierSummary i : items) {
                csv.append(escape(i.getCashierName())).append(",")
                        .append(i.getOrdersCount()).append(",")
                        .append(i.getCashSales()).append(",")
                        .append(i.getCardSales()).append(",")
                        .append(i.getOtherSales()).append(",")
                        .append(i.getTotalSales()).append(",")
                        .append(i.getTotalRefunds()).append(",")
                        .append(i.getNetSales()).append("\n");
            }
        } else if ("PROFIT".equalsIgnoreCase(reportType)) {
            ReportDto.ProfitLoss p = getProfitLossReport(tenantId, from, to, waiterId, kitchenId, principal);
            csv.append("Ko'rsatkich,Qiymat\n");
            csv.append("Jami tushum (Revenue),").append(p.getTotalRevenue()).append("\n");
            csv.append("Mahsulot tannarxi (Cost),").append(p.getTotalProductCost()).append("\n");
            csv.append("Chegirmalar (Discount),").append(p.getTotalDiscounts()).append("\n");
            csv.append("Qaytarishlar (Refund),").append(p.getTotalRefunds()).append("\n");
            csv.append("Sof yalpi foyda (Gross Profit),").append(p.getGrossProfit()).append("\n");
            csv.append("Rentabellik (Margin %),").append(p.getProfitMargin()).append("%\n");
        } else {
            // SAVDO / GENERAL
            ReportDto.SalesSummary s = getSalesSummary(tenantId, from, to, waiterId, kitchenId, principal);
            csv.append("Ko'rsatkich,Qiymat\n");
            csv.append("Jami savdo,").append(s.getTotalSales()).append("\n");
            csv.append("Jami buyurtmalar,").append(s.getTotalOrders()).append("\n");
            csv.append("Jami to'lov,").append(s.getTotalPayments()).append("\n");
            csv.append("O'rtacha chek,").append(s.getAvgCheck()).append("\n");
            csv.append("Naqd to'lov,").append(s.getCashTotal()).append("\n");
            csv.append("Karta to'lov,").append(s.getCardTotal()).append("\n");
            csv.append("Boshqa to'lovlar,").append(s.getOtherTotal()).append("\n");
            csv.append("Bekor qilingan buyurtmalar,").append(s.getCancelledOrdersCount()).append("\n");
            csv.append("Qaytarilgan summa,").append(s.getRefundedAmount()).append("\n");
        }

        return csv.toString();
    }

    private String escape(String val) {
        if (val == null) return "";
        if (val.contains(",") || val.contains("\"")) {
            return "\"" + val.replace("\"", "\"\"") + "\"";
        }
        return val;
    }

    // ==========================================
    // LEGACY METHODS (BACKWARD COMPATIBILITY)
    // ==========================================
    @Transactional(readOnly = true)
    public ReportDto.DailySummary getDailySummary(UUID tenantId, LocalDate date) {
        Instant from = date.atStartOfDay(TASHKENT_ZONE).toInstant();
        Instant to   = date.plusDays(1).atStartOfDay(TASHKENT_ZONE).toInstant();

        ReportDto.SalesSummary summary = getSalesSummary(tenantId, from, to, null, null);
        List<ReportDto.ProductSaleItem> topProdItems = getProductSalesReport(tenantId, from, to, null, null);

        List<ReportDto.TopProduct> topProducts = topProdItems.stream()
                .limit(10)
                .map(p -> ReportDto.TopProduct.builder()
                        .productName(p.getProductName())
                        .quantity(p.getQuantity().longValue())
                        .revenue(p.getRevenue())
                        .build())
                .collect(Collectors.toList());

        return ReportDto.DailySummary.builder()
                .date(from)
                .totalRevenue(summary.getTotalSales())
                .cashRevenue(summary.getCashTotal())
                .cardRevenue(summary.getCardTotal())
                .totalRefunds(summary.getRefundedAmount())
                .totalOrders(summary.getTotalOrders())
                .completedOrders(summary.getTotalOrders())
                .refundedOrders(summary.getRefundedOrdersCount())
                .avgOrderValue(summary.getAvgCheck())
                .topProducts(topProducts)
                .hourlyRevenue(summary.getHourlySales())
                .build();
    }

    @Transactional(readOnly = true)
    public List<ReportDto.ShiftSummary> getShiftReports(UUID tenantId, LocalDate date) {
        Instant from = date.atStartOfDay(TASHKENT_ZONE).toInstant();
        Instant to   = date.plusDays(1).atStartOfDay(TASHKENT_ZONE).toInstant();

        return shiftRepository.findByTenantIdAndOpenedAtBetween(tenantId, from, to).stream()
                .map(s -> ReportDto.ShiftSummary.builder()
                        .shiftId(s.getId())
                        .cashierName(s.getCashier() != null
                                ? s.getCashier().getFirstName() + " " +
                                (s.getCashier().getLastName() != null ? s.getCashier().getLastName() : "")
                                : "Unknown")
                        .openedAt(s.getOpenedAt())
                        .closedAt(s.getClosedAt())
                        .totalSales(s.getTotalSales())
                        .totalCash(s.getTotalCashSales())
                        .totalCard(s.getTotalCardSales())
                        .totalRefunds(s.getTotalRefunds())
                        .ordersCount(s.getOrdersCount())
                        .build())
                .collect(Collectors.toList());
    }
}
