package com.restaurantpos.kitchen;

import com.restaurantpos.kitchen.entity.Kitchen;
import com.restaurantpos.kitchen.entity.KitchenOrderBatch;
import com.restaurantpos.kitchen.entity.KitchenOrderBatchItem;
import com.restaurantpos.kitchen.repository.KitchenOrderBatchItemRepository;
import com.restaurantpos.kitchen.repository.KitchenOrderBatchRepository;
import com.restaurantpos.kitchen.repository.KitchenTicketRepository;
import com.restaurantpos.kitchen.service.KitchenService;
import com.restaurantpos.orders.dto.OrderDto;
import com.restaurantpos.orders.entity.Order;
import com.restaurantpos.orders.entity.OrderItem;
import com.restaurantpos.orders.repository.OrderItemRepository;
import com.restaurantpos.orders.repository.OrderRepository;
import com.restaurantpos.orders.service.OrderService;
import com.restaurantpos.printers.service.PrintRoutingService;
import com.restaurantpos.products.entity.Product;
import com.restaurantpos.products.repository.ProductRepository;
import com.restaurantpos.tenants.entity.Tenant;
import com.restaurantpos.users.entity.User;
import com.restaurantpos.users.repository.UserRepository;
import com.restaurantpos.common.websocket.WebSocketNotificationService;
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
import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class KitchenOrderBatchServiceTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private OrderItemRepository orderItemRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private KitchenOrderBatchRepository kitchenOrderBatchRepository;
    @Mock
    private KitchenOrderBatchItemRepository kitchenOrderBatchItemRepository;
    @Mock
    private KitchenTicketRepository kitchenTicketRepository;
    @Mock
    private WebSocketNotificationService wsNotification;
    @Mock
    private PrintRoutingService printRoutingService;

    @InjectMocks
    private OrderService orderService;

    private Tenant tenant;
    private User waiter;
    private Kitchen plovKitchen;
    private Kitchen pizzaKitchen;
    private Product oshProduct;
    private Product pizzaProduct;
    private Product burgerProduct;

    @BeforeEach
    void setUp() {
        tenant = new Tenant();
        tenant.setId(UUID.randomUUID());
        tenant.setName("Test Restaurant");

        waiter = new User();
        waiter.setId(UUID.randomUUID());
        waiter.setTenant(tenant);
        waiter.setFirstName("Ali");
        waiter.setLastName("Ofitsiant");

        plovKitchen = new Kitchen();
        plovKitchen.setId(UUID.randomUUID());
        plovKitchen.setName("Palovchi");
        plovKitchen.setCode("PLOV");

        pizzaKitchen = new Kitchen();
        pizzaKitchen.setId(UUID.randomUUID());
        pizzaKitchen.setName("Pitsaxona");
        pizzaKitchen.setCode("PIZZA");

        oshProduct = new Product();
        oshProduct.setId(UUID.randomUUID());
        oshProduct.setName("Osh (To'y oshi)");
        oshProduct.setSalePrice(new BigDecimal("35000"));
        oshProduct.setKitchen(plovKitchen);

        pizzaProduct = new Product();
        pizzaProduct.setId(UUID.randomUUID());
        pizzaProduct.setName("Pizza Margarita");
        pizzaProduct.setSalePrice(new BigDecimal("65000"));
        pizzaProduct.setKitchen(pizzaKitchen);

        burgerProduct = new Product();
        burgerProduct.setId(UUID.randomUUID());
        burgerProduct.setName("Burger Classic");
        burgerProduct.setSalePrice(new BigDecimal("30000"));
        burgerProduct.setKitchen(pizzaKitchen);

        when(kitchenOrderBatchRepository.save(any(KitchenOrderBatch.class))).thenAnswer(inv -> {
            KitchenOrderBatch b = inv.getArgument(0);
            if (b.getId() == null) b.setId(UUID.randomUUID());
            return b;
        });

        when(kitchenOrderBatchItemRepository.save(any(KitchenOrderBatchItem.class))).thenAnswer(inv -> {
            KitchenOrderBatchItem bi = inv.getArgument(0);
            if (bi.getId() == null) bi.setId(UUID.randomUUID());
            return bi;
        });

        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void testInitialSendCreatesBatch1WithInitialQuantity() {
        // SCENARIO 1: Waiter orders 4x Osh and sends to kitchen
        Order order = new Order();
        order.setId(UUID.randomUUID());
        order.setTenant(tenant);
        order.setOrderNumber("ORD-20260918-0001");
        order.setStatus(Order.OrderStatus.OPEN);
        order.setWaiter(waiter);

        OrderItem item = new OrderItem();
        item.setId(UUID.randomUUID());
        item.setOrder(order);
        item.setProduct(oshProduct);
        item.setProductName(oshProduct.getName());
        item.setQuantity(new BigDecimal("4"));
        item.setUnitPrice(new BigDecimal("35000"));
        item.setSubtotal(new BigDecimal("140000"));
        item.setKitchen(plovKitchen);
        item.setSentQuantity(BigDecimal.ZERO);
        item.setKitchenStatus(OrderItem.KitchenStatus.NEW);
        order.getItems().add(item);

        when(orderRepository.findByIdAndTenantIdAndDeletedAtIsNull(order.getId(), tenant.getId()))
                .thenReturn(Optional.of(order));
        when(kitchenOrderBatchRepository.findTopByOrderIdOrderByBatchNumberDesc(order.getId()))
                .thenReturn(Optional.empty());

        orderService.sendNewItemsToKitchen(order.getId(), tenant.getId(), null);

        // Verification:
        // 1. KitchenOrderBatch was created with batchNumber = 1 and batchType = INITIAL
        ArgumentCaptor<KitchenOrderBatch> batchCaptor = ArgumentCaptor.forClass(KitchenOrderBatch.class);
        verify(kitchenOrderBatchRepository).save(batchCaptor.capture());
        KitchenOrderBatch createdBatch = batchCaptor.getValue();

        assertEquals(1, createdBatch.getBatchNumber());
        assertEquals(KitchenOrderBatch.BatchType.INITIAL, createdBatch.getBatchType());
        assertEquals(plovKitchen, createdBatch.getKitchen());

        // 2. KitchenOrderBatchItem was created with quantity = 4
        ArgumentCaptor<KitchenOrderBatchItem> itemCaptor = ArgumentCaptor.forClass(KitchenOrderBatchItem.class);
        verify(kitchenOrderBatchItemRepository).save(itemCaptor.capture());
        KitchenOrderBatchItem batchItem = itemCaptor.getValue();

        assertEquals(new BigDecimal("4"), batchItem.getQuantity());
        assertEquals(oshProduct.getName(), batchItem.getProductName());

        // 3. OrderItem sentQuantity is now 4 and kitchenStatus is SENT_TO_KITCHEN
        assertEquals(new BigDecimal("4"), item.getSentQuantity());
        assertEquals(OrderItem.KitchenStatus.SENT_TO_KITCHEN, item.getKitchenStatus());

        // 4. Print routing received batch #1
        ArgumentCaptor<List<KitchenOrderBatch>> printCaptor = ArgumentCaptor.forClass(List.class);
        verify(printRoutingService).routeAndPrintKitchenBatches(printCaptor.capture());
        assertEquals(1, printCaptor.getValue().size());
        assertEquals(1, printCaptor.getValue().get(0).getBatchNumber());
    }

    @Test
    void testAdditionalSendCreatesBatch2WithOnlyIncrementalQuantity() {
        // SCENARIO 2: Order already has 4x Osh sent (Batch #1).
        // Customer asks for 1x Osh more. Waiter adds 1x Osh (total = 5x Osh).
        Order order = new Order();
        order.setId(UUID.randomUUID());
        order.setTenant(tenant);
        order.setOrderNumber("ORD-20260918-0001");
        order.setStatus(Order.OrderStatus.IN_PROGRESS);
        order.setWaiter(waiter);

        OrderItem item = new OrderItem();
        item.setId(UUID.randomUUID());
        item.setOrder(order);
        item.setProduct(oshProduct);
        item.setProductName(oshProduct.getName());
        item.setQuantity(new BigDecimal("5")); // total 5 in cart
        item.setUnitPrice(new BigDecimal("35000"));
        item.setSubtotal(new BigDecimal("175000"));
        item.setKitchen(plovKitchen);
        item.setSentQuantity(new BigDecimal("4")); // 4 was previously sent!
        item.setKitchenStatus(OrderItem.KitchenStatus.PARTIALLY_SENT);
        order.getItems().add(item);

        when(orderRepository.findByIdAndTenantIdAndDeletedAtIsNull(order.getId(), tenant.getId()))
                .thenReturn(Optional.of(order));

        KitchenOrderBatch batch1 = new KitchenOrderBatch();
        batch1.setId(UUID.randomUUID());
        batch1.setOrder(order);
        batch1.setBatchNumber(1);
        batch1.setBatchType(KitchenOrderBatch.BatchType.INITIAL);
        when(kitchenOrderBatchRepository.findTopByOrderIdOrderByBatchNumberDesc(order.getId()))
                .thenReturn(Optional.of(batch1));

        orderService.sendNewItemsToKitchen(order.getId(), tenant.getId(), null);

        // Verification:
        // 1. KitchenOrderBatch #2 created with type ADDON
        ArgumentCaptor<KitchenOrderBatch> batchCaptor = ArgumentCaptor.forClass(KitchenOrderBatch.class);
        verify(kitchenOrderBatchRepository).save(batchCaptor.capture());
        KitchenOrderBatch batch2 = batchCaptor.getValue();

        assertEquals(2, batch2.getBatchNumber());
        assertEquals(KitchenOrderBatch.BatchType.ADDON, batch2.getBatchType());

        // 2. KitchenOrderBatchItem quantity must be exactly 1 (NOT 5, NOT 4!)
        ArgumentCaptor<KitchenOrderBatchItem> itemCaptor = ArgumentCaptor.forClass(KitchenOrderBatchItem.class);
        verify(kitchenOrderBatchItemRepository).save(itemCaptor.capture());
        KitchenOrderBatchItem batchItem = itemCaptor.getValue();

        assertEquals(new BigDecimal("1"), batchItem.getQuantity());

        // 3. OrderItem sentQuantity is now 5
        assertEquals(new BigDecimal("5"), item.getSentQuantity());

        // 4. Printer received ONLY the new batch with quantity 1
        ArgumentCaptor<List<KitchenOrderBatch>> printCaptor = ArgumentCaptor.forClass(List.class);
        verify(printRoutingService).routeAndPrintKitchenBatches(printCaptor.capture());
        assertEquals(1, printCaptor.getValue().size());
        assertEquals(2, printCaptor.getValue().get(0).getBatchNumber());
        assertEquals(KitchenOrderBatch.BatchType.ADDON, printCaptor.getValue().get(0).getBatchType());
    }

    @Test
    void testThirdSendCreatesBatch3() {
        // SCENARIO 3: After Batch 1 (4x) and Batch 2 (1x), customer asks for 2x Osh more.
        Order order = new Order();
        order.setId(UUID.randomUUID());
        order.setTenant(tenant);
        order.setOrderNumber("ORD-20260918-0001");
        order.setStatus(Order.OrderStatus.IN_PROGRESS);
        order.setWaiter(waiter);

        OrderItem item = new OrderItem();
        item.setId(UUID.randomUUID());
        item.setOrder(order);
        item.setProduct(oshProduct);
        item.setProductName(oshProduct.getName());
        item.setQuantity(new BigDecimal("7")); // total 7 in cart
        item.setKitchen(plovKitchen);
        item.setSentQuantity(new BigDecimal("5")); // 5 previously sent (4 + 1)
        order.getItems().add(item);

        when(orderRepository.findByIdAndTenantIdAndDeletedAtIsNull(order.getId(), tenant.getId()))
                .thenReturn(Optional.of(order));

        KitchenOrderBatch batch2 = new KitchenOrderBatch();
        batch2.setBatchNumber(2);
        when(kitchenOrderBatchRepository.findTopByOrderIdOrderByBatchNumberDesc(order.getId()))
                .thenReturn(Optional.of(batch2));

        orderService.sendNewItemsToKitchen(order.getId(), tenant.getId(), null);

        ArgumentCaptor<KitchenOrderBatch> batchCaptor = ArgumentCaptor.forClass(KitchenOrderBatch.class);
        verify(kitchenOrderBatchRepository).save(batchCaptor.capture());
        KitchenOrderBatch batch3 = batchCaptor.getValue();

        assertEquals(3, batch3.getBatchNumber());
        assertEquals(KitchenOrderBatch.BatchType.ADDON, batch3.getBatchType());

        ArgumentCaptor<KitchenOrderBatchItem> itemCaptor = ArgumentCaptor.forClass(KitchenOrderBatchItem.class);
        verify(kitchenOrderBatchItemRepository).save(itemCaptor.capture());
        assertEquals(new BigDecimal("2"), itemCaptor.getValue().getQuantity());
        assertEquals(new BigDecimal("7"), item.getSentQuantity());
    }

    @Test
    void testMultiProductIncrementalSendExcludesAlreadySentItems() {
        // SCENARIO 4: Pizza x2 + Burger x1 sent earlier.
        // Later: Pizza x1 added.
        // Expected: Batch #2 contains ONLY Pizza x1. Burger is NOT included!
        Order order = new Order();
        order.setId(UUID.randomUUID());
        order.setTenant(tenant);
        order.setOrderNumber("ORD-20260918-0001");
        order.setStatus(Order.OrderStatus.IN_PROGRESS);
        order.setWaiter(waiter);

        OrderItem pizzaItem = new OrderItem();
        pizzaItem.setId(UUID.randomUUID());
        pizzaItem.setOrder(order);
        pizzaItem.setProduct(pizzaProduct);
        pizzaItem.setProductName(pizzaProduct.getName());
        pizzaItem.setQuantity(new BigDecimal("3")); // 2 was sent + 1 new = 3
        pizzaItem.setSentQuantity(new BigDecimal("2"));
        pizzaItem.setKitchen(pizzaKitchen);
        order.getItems().add(pizzaItem);

        OrderItem burgerItem = new OrderItem();
        burgerItem.setId(UUID.randomUUID());
        burgerItem.setOrder(order);
        burgerItem.setProduct(burgerProduct);
        burgerItem.setProductName(burgerProduct.getName());
        burgerItem.setQuantity(new BigDecimal("1")); // 1 was sent, no new
        burgerItem.setSentQuantity(new BigDecimal("1"));
        burgerItem.setKitchen(pizzaKitchen);
        order.getItems().add(burgerItem);

        when(orderRepository.findByIdAndTenantIdAndDeletedAtIsNull(order.getId(), tenant.getId()))
                .thenReturn(Optional.of(order));

        KitchenOrderBatch batch1 = new KitchenOrderBatch();
        batch1.setBatchNumber(1);
        when(kitchenOrderBatchRepository.findTopByOrderIdOrderByBatchNumberDesc(order.getId()))
                .thenReturn(Optional.of(batch1));

        orderService.sendNewItemsToKitchen(order.getId(), tenant.getId(), null);

        ArgumentCaptor<KitchenOrderBatchItem> itemCaptor = ArgumentCaptor.forClass(KitchenOrderBatchItem.class);
        verify(kitchenOrderBatchItemRepository, times(1)).save(itemCaptor.capture());

        KitchenOrderBatchItem batchItem = itemCaptor.getValue();
        assertEquals(pizzaProduct.getName(), batchItem.getProductName());
        assertEquals(new BigDecimal("1"), batchItem.getQuantity());
        // Burger was never saved to batch items for Batch #2!
    }

    @Test
    void testBatchStatusTransitionsAreIndependent() {
        // SCENARIO 6: Batch #1 status change does NOT affect Batch #2
        KitchenService kitchenService = new KitchenService(
                null, null, orderRepository, orderItemRepository, orderService,
                wsNotification, null, null, null, null, null,
                kitchenOrderBatchRepository, kitchenOrderBatchItemRepository,
                null, null, null, null, null
        );

        Order order = new Order();
        order.setId(UUID.randomUUID());
        order.setTenant(tenant);
        order.setOrderNumber("ORD-20260918-0001");
        order.setStatus(Order.OrderStatus.IN_PROGRESS);

        KitchenOrderBatch batch1 = new KitchenOrderBatch();
        batch1.setId(UUID.randomUUID());
        batch1.setTenant(tenant);
        batch1.setOrder(order);
        batch1.setKitchen(plovKitchen);
        batch1.setBatchNumber(1);
        batch1.setStatus(KitchenOrderBatch.BatchStatus.COOKING);

        KitchenOrderBatchItem item1 = new KitchenOrderBatchItem();
        item1.setId(UUID.randomUUID());
        item1.setBatch(batch1);
        item1.setProduct(oshProduct);
        item1.setProductName("4x Osh");
        item1.setQuantity(new BigDecimal("4"));
        item1.setStatus(KitchenOrderBatchItem.ItemStatus.COOKING);
        batch1.getItems().add(item1);

        KitchenOrderBatch batch2 = new KitchenOrderBatch();
        batch2.setId(UUID.randomUUID());
        batch2.setTenant(tenant);
        batch2.setOrder(order);
        batch2.setKitchen(plovKitchen);
        batch2.setBatchNumber(2);
        batch2.setBatchType(KitchenOrderBatch.BatchType.ADDON);
        batch2.setStatus(KitchenOrderBatch.BatchStatus.NEW);

        KitchenOrderBatchItem item2 = new KitchenOrderBatchItem();
        item2.setId(UUID.randomUUID());
        item2.setBatch(batch2);
        item2.setProduct(oshProduct);
        item2.setProductName("1x Osh");
        item2.setQuantity(new BigDecimal("1"));
        item2.setStatus(KitchenOrderBatchItem.ItemStatus.NEW);
        batch2.getItems().add(item2);

        when(kitchenOrderBatchRepository.findByIdAndTenantId(batch1.getId(), tenant.getId()))
                .thenReturn(Optional.of(batch1));
        when(kitchenOrderBatchRepository.findByIdAndTenantId(batch2.getId(), tenant.getId()))
                .thenReturn(Optional.of(batch2));

        // Act: Chef marks Batch #1 as READY
        kitchenService.updateBatchStatus(batch1.getId(), tenant.getId(), "READY", null);

        // Verification:
        // Batch #1 is now READY
        assertEquals(KitchenOrderBatch.BatchStatus.READY, batch1.getStatus());
        assertEquals(KitchenOrderBatchItem.ItemStatus.READY, item1.getStatus());

        // Batch #2 is STILL NEW! (Unchanged, completely independent)
        assertEquals(KitchenOrderBatch.BatchStatus.NEW, batch2.getStatus());
        assertEquals(KitchenOrderBatchItem.ItemStatus.NEW, item2.getStatus());
    }
}
