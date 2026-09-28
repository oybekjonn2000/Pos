package com.restaurantpos.orders;

import com.restaurantpos.auth.security.UserPrincipal;
import com.restaurantpos.common.exception.PosException;
import com.restaurantpos.common.websocket.WebSocketNotificationService;
import com.restaurantpos.debt.repository.DebtRepository;
import com.restaurantpos.orders.dto.OrderDto;
import com.restaurantpos.orders.entity.Order;
import com.restaurantpos.orders.repository.OrderItemRepository;
import com.restaurantpos.orders.repository.OrderRepository;
import com.restaurantpos.orders.service.OrderService;
import com.restaurantpos.payments.repository.PaymentRepository;
import com.restaurantpos.settings.service.AuditLogService;
import com.restaurantpos.tables.entity.RestaurantTable;
import com.restaurantpos.tables.entity.TableZone;
import com.restaurantpos.tables.repository.RestaurantTableRepository;
import com.restaurantpos.tables.repository.TableZoneRepository;
import com.restaurantpos.tenants.entity.Tenant;
import com.restaurantpos.users.entity.Role;
import com.restaurantpos.users.entity.User;
import com.restaurantpos.users.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class OrderMoveTableTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private OrderItemRepository orderItemRepository;
    @Mock
    private RestaurantTableRepository tableRepository;
    @Mock
    private TableZoneRepository tableZoneRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private DebtRepository debtRepository;
    @Mock
    private WebSocketNotificationService wsNotification;
    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private OrderService orderService;

    private Tenant tenant;
    private User adminUser;
    private User waiterAli;
    private User waiterVali;
    private UserPrincipal adminPrincipal;
    private UserPrincipal waiterAliPrincipal;
    private UserPrincipal waiterValiPrincipal;
    private TableZone basementZone;
    private TableZone mainZone;
    private RestaurantTable sourceTable5;
    private RestaurantTable targetTable4;
    private Order activeOrder;

    @BeforeEach
    void setUp() {
        tenant = new Tenant();
        tenant.setId(UUID.randomUUID());
        tenant.setName("Test Restoran");

        Role roleAdmin = new Role();
        roleAdmin.setName("ADMIN");

        Role roleWaiter = new Role();
        roleWaiter.setName("WAITER");

        adminUser = new User();
        adminUser.setId(UUID.randomUUID());
        adminUser.setUsername("admin");
        adminUser.setTenant(tenant);
        adminUser.setRoles(Set.of(roleAdmin));

        waiterAli = new User();
        waiterAli.setId(UUID.randomUUID());
        waiterAli.setUsername("ali");
        waiterAli.setFirstName("Ali");
        waiterAli.setTenant(tenant);
        waiterAli.setRoles(Set.of(roleWaiter));

        waiterVali = new User();
        waiterVali.setId(UUID.randomUUID());
        waiterVali.setUsername("vali");
        waiterVali.setFirstName("Vali");
        waiterVali.setTenant(tenant);
        waiterVali.setRoles(Set.of(roleWaiter));

        adminPrincipal = UserPrincipal.builder()
                .userId(adminUser.getId())
                .tenantId(tenant.getId())
                .username("admin")
                .role("ADMIN")
                .permissions(Set.of("ROLE_ADMIN", "EDIT_ORDER", "MANAGE_TABLES"))
                .active(true)
                .build();

        waiterAliPrincipal = UserPrincipal.builder()
                .userId(waiterAli.getId())
                .tenantId(tenant.getId())
                .username("ali")
                .role("WAITER")
                .permissions(Set.of("ROLE_WAITER"))
                .active(true)
                .build();

        waiterValiPrincipal = UserPrincipal.builder()
                .userId(waiterVali.getId())
                .tenantId(tenant.getId())
                .username("vali")
                .role("WAITER")
                .permissions(Set.of("ROLE_WAITER"))
                .active(true)
                .build();

        basementZone = new TableZone();
        basementZone.setId(UUID.randomUUID());
        basementZone.setName("Padval");
        basementZone.setTenant(tenant);

        mainZone = new TableZone();
        mainZone.setId(UUID.randomUUID());
        mainZone.setName("Asosiy zal");
        mainZone.setTenant(tenant);

        sourceTable5 = new RestaurantTable();
        sourceTable5.setId(UUID.randomUUID());
        sourceTable5.setTableNumber("5");
        sourceTable5.setName("Stol 5");
        sourceTable5.setStatus(RestaurantTable.TableStatus.OCCUPIED);
        sourceTable5.setActive(true);
        sourceTable5.setZone(basementZone);
        sourceTable5.setTenant(tenant);

        targetTable4 = new RestaurantTable();
        targetTable4.setId(UUID.randomUUID());
        targetTable4.setTableNumber("4");
        targetTable4.setName("Stol 4");
        targetTable4.setStatus(RestaurantTable.TableStatus.FREE);
        targetTable4.setActive(true);
        targetTable4.setZone(mainZone);
        targetTable4.setTenant(tenant);

        activeOrder = new Order();
        activeOrder.setId(UUID.randomUUID());
        activeOrder.setOrderNumber("ORD-1025");
        activeOrder.setStatus(Order.OrderStatus.OPEN);
        activeOrder.setTenant(tenant);
        activeOrder.setTable(sourceTable5);
        activeOrder.setZone(basementZone);
        activeOrder.setWaiter(waiterAli);
        activeOrder.setTotal(new BigDecimal("350000.00"));
        activeOrder.setSubtotal(new BigDecimal("350000.00"));
        activeOrder.setItems(new ArrayList<>());

        when(orderRepository.findByIdWithLock(activeOrder.getId(), tenant.getId())).thenReturn(Optional.of(activeOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(tableRepository.save(any(RestaurantTable.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentRepository.findByOrderId(any())).thenReturn(Collections.emptyList());
        when(debtRepository.findByTenantIdAndOrderIdAndDeletedAtIsNull(any(), any())).thenReturn(Optional.empty());

        when(tableRepository.findByIdWithLock(sourceTable5.getId(), tenant.getId())).thenReturn(Optional.of(sourceTable5));
        when(tableRepository.findByIdWithLock(targetTable4.getId(), tenant.getId())).thenReturn(Optional.of(targetTable4));
    }

    @Test
    @DisplayName("1. Muvaffaqiyatli ko'chirish: Eski stol BO'SH, yangi stol BAND, ofitsiant va summalar o'zgarmasligi")
    void testMoveActiveOrder_Success() {
        OrderDto.MoveTableRequest req = new OrderDto.MoveTableRequest();
        req.setTargetTableId(targetTable4.getId());
        req.setReason("Mijoz padvalni yoqtirmadi");

        OrderDto.Response result = orderService.moveOrderTable(activeOrder.getId(), tenant.getId(), adminPrincipal, req);

        assertNotNull(result);
        // Eski stol FREE bo'lishi kerak
        assertEquals(RestaurantTable.TableStatus.FREE, sourceTable5.getStatus());
        // Yangi stol OCCUPIED bo'lishi kerak
        assertEquals(RestaurantTable.TableStatus.OCCUPIED, targetTable4.getStatus());
        // Buyurtma yangi stolga bog'langan bo'lishi kerak
        assertEquals(targetTable4.getId(), activeOrder.getTable().getId());
        assertEquals(mainZone.getId(), activeOrder.getZone().getId());
        // Ofitsiant o'zgarmasligi kerak (Ali bo'lib qoladi)
        assertEquals(waiterAli.getId(), activeOrder.getWaiter().getId());
        // Summa o'zgarmasligi kerak (350 000 so'm)
        assertEquals(new BigDecimal("350000.00"), activeOrder.getTotal());

        // WebSocket xabarnomasi yuborilganligini tekshirish
        verify(wsNotification, times(1)).notifyOrderTableMoved(eq(tenant.getId()), any());
    }

    @Test
    @DisplayName("2. Target stol BAND bo'lsa xatolik (PosException) qaytarish")
    void testMoveOrder_TargetTableOccupied_ThrowsBadRequest() {
        targetTable4.setStatus(RestaurantTable.TableStatus.OCCUPIED);

        OrderDto.MoveTableRequest req = new OrderDto.MoveTableRequest();
        req.setTargetTableId(targetTable4.getId());
        req.setReason("Mijoz so'rovi");

        PosException ex = assertThrows(PosException.class, () ->
                orderService.moveOrderTable(activeOrder.getId(), tenant.getId(), adminPrincipal, req)
        );
        assertTrue(ex.getMessage().contains("band qilindi"));
    }

    @Test
    @DisplayName("3. Target stol FAOL EMAS (DISABLED) bo'lsa xatolik qaytarish")
    void testMoveOrder_TargetTableDisabled_ThrowsBadRequest() {
        targetTable4.setActive(false);

        OrderDto.MoveTableRequest req = new OrderDto.MoveTableRequest();
        req.setTargetTableId(targetTable4.getId());

        PosException ex = assertThrows(PosException.class, () ->
                orderService.moveOrderTable(activeOrder.getId(), tenant.getId(), adminPrincipal, req)
        );
        assertTrue(ex.getMessage().contains("faol emas"));
    }

    @Test
    @DisplayName("4. Buyurtma PAID yoki CLOSED holatda bo'lsa ko'chirishga ruxsat bermaslik")
    void testMoveOrder_OrderNotActive_ThrowsBadRequest() {
        activeOrder.setStatus(Order.OrderStatus.PAID);

        OrderDto.MoveTableRequest req = new OrderDto.MoveTableRequest();
        req.setTargetTableId(targetTable4.getId());

        PosException ex = assertThrows(PosException.class, () ->
                orderService.moveOrderTable(activeOrder.getId(), tenant.getId(), adminPrincipal, req)
        );
        assertTrue(ex.getMessage().contains("Faqat aktiv buyurtmalar"));
    }

    @Test
    @DisplayName("5. Boshqa restoranning (tenant) stoli yuborilsa PosException qaytarish")
    void testMoveOrder_DifferentTenantTable_ThrowsNotFound() {
        when(tableRepository.findByIdWithLock(targetTable4.getId(), tenant.getId())).thenReturn(Optional.empty());

        OrderDto.MoveTableRequest req = new OrderDto.MoveTableRequest();
        req.setTargetTableId(targetTable4.getId());

        assertThrows(PosException.class, () ->
                orderService.moveOrderTable(activeOrder.getId(), tenant.getId(), adminPrincipal, req)
        );
    }

    @Test
    @DisplayName("6. Begona ofitsiant boshqa ofitsiantning buyurtmasini ko'chira olmasligi")
    void testMoveOrder_OtherWaiterTriesToMove_ThrowsBadRequest() {
        OrderDto.MoveTableRequest req = new OrderDto.MoveTableRequest();
        req.setTargetTableId(targetTable4.getId());

        PosException ex = assertThrows(PosException.class, () ->
                orderService.moveOrderTable(activeOrder.getId(), tenant.getId(), waiterValiPrincipal, req)
        );
        assertTrue(ex.getMessage().contains("boshqa ofitsantga tegishli"));
    }
}
