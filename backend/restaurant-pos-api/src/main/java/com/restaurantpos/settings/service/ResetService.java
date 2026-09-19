package com.restaurantpos.settings.service;

import com.restaurantpos.common.exception.PosException;
import com.restaurantpos.common.websocket.WebSocketNotificationService;
import com.restaurantpos.settings.dto.ResetDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResetService {

    private final JdbcTemplate jdbcTemplate;
    private final AuditLogService auditLogService;
    private final WebSocketNotificationService wsNotification;

    /**
     * 1. Reset Orders & Operational History
     * Deletes orders, order items, payments, kitchen batches/tickets, cancellation receipts.
     * Frees all occupied tables and resets shift counters.
     * Products, Categories, Kitchens, Tables, and Zones are preserved.
     */
    @Transactional
    public ResetDto.OrdersResetResult resetOrders(UUID tenantId, UUID userId) {
        log.info("Resetting orders and operational history for tenant: {}, initiated by user: {}", tenantId, userId);
        try {
            int cancellationReceipts = jdbcTemplate.update(
                    "DELETE FROM cancellation_receipts WHERE tenant_id = ?", tenantId);

            int payments = jdbcTemplate.update(
                    "DELETE FROM payments WHERE tenant_id = ?", tenantId);

            jdbcTemplate.update(
                    "DELETE FROM kitchen_order_batch_items WHERE tenant_id = ?", tenantId);

            int kitchenBatches = jdbcTemplate.update(
                    "DELETE FROM kitchen_order_batches WHERE tenant_id = ?", tenantId);

            int kitchenTickets = jdbcTemplate.update(
                    "DELETE FROM kitchen_tickets WHERE tenant_id = ?", tenantId);

            jdbcTemplate.update(
                    "DELETE FROM order_item_modifiers WHERE order_item_id IN (SELECT id FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE tenant_id = ?))", tenantId);

            int orderItems = jdbcTemplate.update(
                    "DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE tenant_id = ?)", tenantId);

            int tablesFreed = jdbcTemplate.update(
                    "UPDATE restaurant_tables SET current_order_id = NULL, status = 'FREE', waiter_id = NULL WHERE tenant_id = ?", tenantId);

            int orders = jdbcTemplate.update(
                    "DELETE FROM orders WHERE tenant_id = ?", tenantId);

            jdbcTemplate.update(
                    "UPDATE shifts SET orders_count = 0, total_sales = 0, total_cash_sales = 0, total_card_sales = 0, total_refunds = 0, total_discounts = 0 WHERE tenant_id = ?", tenantId);

            jdbcTemplate.update(
                    "UPDATE customers SET total_orders = 0, last_order_at = NULL WHERE tenant_id = ?", tenantId);

            auditLogService.logChange(tenantId, userId, "RESET", "ORDERS", null, null,
                    String.format("Deleted %d orders, %d items, %d payments, %d kitchen batches", orders, orderItems, payments, kitchenBatches),
                    "Buyurtmalar tarixi tozalandi");

            // Notify WebSocket listeners that orders were reset
            try {
                wsNotification.notifyOrderStatusChanged(tenantId, null);
            } catch (Exception e) {
                log.warn("Failed to send WS notification after orders reset: {}", e.getMessage());
            }

            return ResetDto.OrdersResetResult.builder()
                    .orders(orders)
                    .orderItems(orderItems)
                    .payments(payments)
                    .kitchenBatches(kitchenBatches)
                    .kitchenTickets(kitchenTickets)
                    .cancellationReceipts(cancellationReceipts)
                    .tablesFreed(tablesFreed)
                    .build();

        } catch (DataIntegrityViolationException ex) {
            log.error("Foreign key violation during orders reset: {}", ex.getMessage(), ex);
            throw PosException.badRequest("Buyurtmalarni o'chirish imkonsiz, bog'langan boshqa ma'lumotlar mavjud: " + ex.getMostSpecificCause().getMessage());
        }
    }

    /**
     * 2. Reset Products
     * Validates that orders history is clean first to prevent FK constraint violations.
     */
    @Transactional
    public ResetDto.EntityResetResult resetProducts(UUID tenantId, UUID userId) {
        log.info("Resetting products for tenant: {}, initiated by user: {}", tenantId, userId);

        // Pre-flight check: Are there order items or kitchen batch items referencing products?
        Integer orderItemsCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE tenant_id = ?)", Integer.class, tenantId);
        if (orderItemsCount != null && orderItemsCount > 0) {
            throw PosException.badRequest("Mahsulotlarni o'chirishdan oldin buyurtmalar tarixini tozalang. (Buyurtmalarda qatnashgan mahsulotlar mavjud: " + orderItemsCount + " ta)");
        }

        Integer batchItemsCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM kitchen_order_batch_items WHERE tenant_id = ?", Integer.class, tenantId);
        if (batchItemsCount != null && batchItemsCount > 0) {
            throw PosException.badRequest("Mahsulotlarni o'chirishdan oldin oshxona buyurtmalarini tozalang. (Oshxonaga yuborilgan mahsulotlar mavjud)");
        }

        try {
            // Clean child entities referencing products
            jdbcTemplate.update("DELETE FROM product_ingredients WHERE product_id IN (SELECT id FROM products WHERE tenant_id = ?)", tenantId);
            jdbcTemplate.update("DELETE FROM product_modifier_groups WHERE product_id IN (SELECT id FROM products WHERE tenant_id = ?)", tenantId);
            jdbcTemplate.update("DELETE FROM recipe_items WHERE recipe_id IN (SELECT id FROM recipes WHERE tenant_id = ?)", tenantId);
            jdbcTemplate.update("DELETE FROM recipes WHERE tenant_id = ?", tenantId);
            jdbcTemplate.update("UPDATE purchase_items SET product_id = NULL WHERE product_id IN (SELECT id FROM products WHERE tenant_id = ?)", tenantId);
            jdbcTemplate.update("DELETE FROM stock_movements WHERE product_id IN (SELECT id FROM products WHERE tenant_id = ?)", tenantId);
            jdbcTemplate.update("DELETE FROM stock_items WHERE product_id IN (SELECT id FROM products WHERE tenant_id = ?)", tenantId);

            int deletedProducts = jdbcTemplate.update("DELETE FROM products WHERE tenant_id = ?", tenantId);

            auditLogService.logChange(tenantId, userId, "RESET", "PRODUCTS", null, null,
                    deletedProducts + " ta mahsulot o'chirildi", "Mahsulotlar tozalandi");

            Map<String, Integer> details = new HashMap<>();
            details.put("products", deletedProducts);

            return ResetDto.EntityResetResult.builder()
                    .entityType("PRODUCTS")
                    .deletedCount(deletedProducts)
                    .message(deletedProducts + " ta mahsulot muvaffaqiyatli tozalandi")
                    .details(details)
                    .build();

        } catch (DataIntegrityViolationException ex) {
            log.error("Foreign key violation during products reset: {}", ex.getMessage(), ex);
            throw PosException.badRequest("Mahsulotlarni o'chirish mumkin emas, bog'langan boshqa ma'lumotlar mavjud.");
        }
    }

    /**
     * 3. Reset Categories
     * Validates that products are removed first.
     */
    @Transactional
    public ResetDto.EntityResetResult resetCategories(UUID tenantId, UUID userId) {
        log.info("Resetting categories for tenant: {}, initiated by user: {}", tenantId, userId);

        Integer productsCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM products WHERE tenant_id = ?", Integer.class, tenantId);
        if (productsCount != null && productsCount > 0) {
            throw PosException.badRequest("Kategoriyalarni o'chirishdan oldin mahsulotlarni o'chiring. (Kategoriyalarga bog'langan " + productsCount + " ta mahsulot mavjud)");
        }

        try {
            // Nullify self-referencing parent_id hierarchy first
            jdbcTemplate.update("UPDATE categories SET parent_id = NULL WHERE tenant_id = ?", tenantId);

            int deletedCategories = jdbcTemplate.update("DELETE FROM categories WHERE tenant_id = ?", tenantId);

            auditLogService.logChange(tenantId, userId, "RESET", "CATEGORIES", null, null,
                    deletedCategories + " ta kategoriya o'chirildi", "Kategoriyalar tozalandi");

            Map<String, Integer> details = new HashMap<>();
            details.put("categories", deletedCategories);

            return ResetDto.EntityResetResult.builder()
                    .entityType("CATEGORIES")
                    .deletedCount(deletedCategories)
                    .message(deletedCategories + " ta kategoriya muvaffaqiyatli tozalandi")
                    .details(details)
                    .build();

        } catch (DataIntegrityViolationException ex) {
            log.error("Foreign key violation during categories reset: {}", ex.getMessage(), ex);
            throw PosException.badRequest("Kategoriyalarni o'chirish mumkin emas, bog'langan boshqa ma'lumotlar mavjud.");
        }
    }

    /**
     * 4. Reset Kitchens
     * Validates categories, products, and order items.
     * Detaches users and printers from kitchens (Users and printers are PRESERVED).
     */
    @Transactional
    public ResetDto.EntityResetResult resetKitchens(UUID tenantId, UUID userId) {
        log.info("Resetting kitchens for tenant: {}, initiated by user: {}", tenantId, userId);

        Integer catCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM categories WHERE kitchen_id IS NOT NULL AND tenant_id = ?", Integer.class, tenantId);
        if (catCount != null && catCount > 0) {
            throw PosException.badRequest("Oshxonalarni o'chirishdan oldin unga bog'langan kategoriyalarni tozalang. (" + catCount + " ta kategoriya bog'langan)");
        }

        Integer prodCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM products WHERE kitchen_id IS NOT NULL AND tenant_id = ?", Integer.class, tenantId);
        if (prodCount != null && prodCount > 0) {
            throw PosException.badRequest("Oshxonalarni o'chirishdan oldin unga bog'langan mahsulotlarni tozalang. (" + prodCount + " ta mahsulot bog'langan)");
        }

        Integer itemsCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM order_items WHERE kitchen_id IS NOT NULL AND order_id IN (SELECT id FROM orders WHERE tenant_id = ?)", Integer.class, tenantId);
        if (itemsCount != null && itemsCount > 0) {
            throw PosException.badRequest("Oshxonalarni o'chirishdan oldin buyurtmalar tarixini tozalang. (Oshxonaga yuborilgan buyurtmalar mavjud)");
        }

        try {
            // Detach users from kitchens safely without deleting users
            int detachedUsers = jdbcTemplate.update(
                    "UPDATE users SET kitchen_id = NULL WHERE kitchen_id IS NOT NULL AND tenant_id = ?", tenantId);

            jdbcTemplate.update("DELETE FROM employee_kitchens WHERE tenant_id = ?", tenantId);

            // Clean printer assignments for kitchens without touching printers
            jdbcTemplate.update("DELETE FROM printer_assignments WHERE kitchen_id IS NOT NULL AND tenant_id = ?", tenantId);

            // Clean empty kitchen tickets if any
            jdbcTemplate.update("DELETE FROM kitchen_tickets WHERE kitchen_id IN (SELECT id FROM kitchens WHERE tenant_id = ?)", tenantId);

            int deletedKitchens = jdbcTemplate.update("DELETE FROM kitchens WHERE tenant_id = ?", tenantId);

            auditLogService.logChange(tenantId, userId, "RESET", "KITCHENS", null, null,
                    deletedKitchens + " ta oshxona o'chirildi, " + detachedUsers + " ta xodim ajratildi", "Oshxonalar tozalandi");

            Map<String, Integer> details = new HashMap<>();
            details.put("kitchens", deletedKitchens);
            details.put("usersDetached", detachedUsers);

            return ResetDto.EntityResetResult.builder()
                    .entityType("KITCHENS")
                    .deletedCount(deletedKitchens)
                    .message(deletedKitchens + " ta oshxona muvaffaqiyatli tozalandi (xodimlar saqlanib qoldi)")
                    .details(details)
                    .build();

        } catch (DataIntegrityViolationException ex) {
            log.error("Foreign key violation during kitchens reset: {}", ex.getMessage(), ex);
            throw PosException.badRequest("Oshxonalarni o'chirish mumkin emas, bog'langan boshqa ma'lumotlar mavjud.");
        }
    }

    /**
     * 5. Reset Tables
     * Validates active orders and order history.
     */
    @Transactional
    public ResetDto.EntityResetResult resetTables(UUID tenantId, UUID userId) {
        log.info("Resetting restaurant tables for tenant: {}, initiated by user: {}", tenantId, userId);

        Integer activeOrders = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM restaurant_tables WHERE current_order_id IS NOT NULL AND tenant_id = ?", Integer.class, tenantId);
        if (activeOrders != null && activeOrders > 0) {
            throw PosException.badRequest("Stollarda faol buyurtmalar mavjud (" + activeOrders + " ta). Avval buyurtmalarni yopish yoki buyurtmalar tarixini tozalash kerak.");
        }

        Integer historicalOrders = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM orders WHERE table_id IS NOT NULL AND tenant_id = ?", Integer.class, tenantId);
        if (historicalOrders != null && historicalOrders > 0) {
            throw PosException.badRequest("Stollarga bog'langan buyurtmalar tarixi mavjud (" + historicalOrders + " ta). Avval buyurtmalar tarixini tozalang.");
        }

        try {
            jdbcTemplate.update("UPDATE cancellation_receipts SET table_id = NULL WHERE tenant_id = ?", tenantId);

            int deletedTables = jdbcTemplate.update("DELETE FROM restaurant_tables WHERE tenant_id = ?", tenantId);

            auditLogService.logChange(tenantId, userId, "RESET", "TABLES", null, null,
                    deletedTables + " ta stol o'chirildi", "Stollar tozalandi");

            Map<String, Integer> details = new HashMap<>();
            details.put("tables", deletedTables);

            return ResetDto.EntityResetResult.builder()
                    .entityType("TABLES")
                    .deletedCount(deletedTables)
                    .message(deletedTables + " ta stol muvaffaqiyatli tozalandi")
                    .details(details)
                    .build();

        } catch (DataIntegrityViolationException ex) {
            log.error("Foreign key violation during tables reset: {}", ex.getMessage(), ex);
            throw PosException.badRequest("Stollarni o'chirish mumkin emas, bog'langan boshqa ma'lumotlar mavjud.");
        }
    }

    /**
     * 6. Reset Zones / Places
     * Validates that tables and orders in zones are removed first.
     */
    @Transactional
    public ResetDto.EntityResetResult resetZones(UUID tenantId, UUID userId) {
        log.info("Resetting table zones/places for tenant: {}, initiated by user: {}", tenantId, userId);

        Integer tablesCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM restaurant_tables WHERE zone_id IS NOT NULL AND tenant_id = ?", Integer.class, tenantId);
        if (tablesCount != null && tablesCount > 0) {
            throw PosException.badRequest("Avval ushbu joylardagi stollarni tozalang. (Zonalarga bog'langan " + tablesCount + " ta stol mavjud)");
        }

        Integer ordersCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM orders WHERE zone_id IS NOT NULL AND tenant_id = ?", Integer.class, tenantId);
        if (ordersCount != null && ordersCount > 0) {
            throw PosException.badRequest("Avval ushbu joylarga bog'langan buyurtmalar tarixini tozalang. (" + ordersCount + " ta buyurtma mavjud)");
        }

        try {
            int deletedZones = jdbcTemplate.update("DELETE FROM table_zones WHERE tenant_id = ?", tenantId);

            auditLogService.logChange(tenantId, userId, "RESET", "ZONES", null, null,
                    deletedZones + " ta joy/zal o'chirildi", "Joylar tozalandi");

            Map<String, Integer> details = new HashMap<>();
            details.put("zones", deletedZones);

            return ResetDto.EntityResetResult.builder()
                    .entityType("ZONES")
                    .deletedCount(deletedZones)
                    .message(deletedZones + " ta joy/zal muvaffaqiyatli tozalandi")
                    .details(details)
                    .build();

        } catch (DataIntegrityViolationException ex) {
            log.error("Foreign key violation during zones reset: {}", ex.getMessage(), ex);
            throw PosException.badRequest("Joylarni o'chirish mumkin emas, bog'langan boshqa ma'lumotlar mavjud.");
        }
    }

    /**
     * 7. RESET ALL (Complete Test Environment Reset)
     * Executes in strict child -> parent dependency order inside a single transaction.
     * Preserves Users, Roles, Permissions, Printers, Settings, and Migrations.
     */
    @Transactional
    public ResetDto.AllResetResult resetAll(UUID tenantId, UUID userId) {
        log.warn("CRITICAL: FULL TEST DATA RESET initiated for tenant: {} by user: {}", tenantId, userId);

        try {
            // 1. Operational data (cancellations, payments, batches, tickets, items, orders)
            int cancellationReceipts = jdbcTemplate.update(
                    "DELETE FROM cancellation_receipts WHERE tenant_id = ?", tenantId);

            int payments = jdbcTemplate.update(
                    "DELETE FROM payments WHERE tenant_id = ?", tenantId);

            jdbcTemplate.update(
                    "DELETE FROM kitchen_order_batch_items WHERE tenant_id = ?", tenantId);

            int kitchenBatches = jdbcTemplate.update(
                    "DELETE FROM kitchen_order_batches WHERE tenant_id = ?", tenantId);

            int kitchenTickets = jdbcTemplate.update(
                    "DELETE FROM kitchen_tickets WHERE tenant_id = ?", tenantId);

            jdbcTemplate.update(
                    "DELETE FROM order_item_modifiers WHERE order_item_id IN (SELECT id FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE tenant_id = ?))", tenantId);

            int orderItems = jdbcTemplate.update(
                    "DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE tenant_id = ?)", tenantId);

            // Free and detach tables
            jdbcTemplate.update(
                    "UPDATE restaurant_tables SET current_order_id = NULL, status = 'FREE', waiter_id = NULL WHERE tenant_id = ?", tenantId);

            int orders = jdbcTemplate.update(
                    "DELETE FROM orders WHERE tenant_id = ?", tenantId);

            // Reset shift and customer counters
            jdbcTemplate.update(
                    "UPDATE shifts SET orders_count = 0, total_sales = 0, total_cash_sales = 0, total_card_sales = 0, total_refunds = 0, total_discounts = 0 WHERE tenant_id = ?", tenantId);

            jdbcTemplate.update(
                    "UPDATE customers SET total_orders = 0, last_order_at = NULL WHERE tenant_id = ?", tenantId);

            // 2. Product-related child records
            jdbcTemplate.update("DELETE FROM product_ingredients WHERE product_id IN (SELECT id FROM products WHERE tenant_id = ?)", tenantId);
            jdbcTemplate.update("DELETE FROM product_modifier_groups WHERE product_id IN (SELECT id FROM products WHERE tenant_id = ?)", tenantId);
            jdbcTemplate.update("DELETE FROM recipe_items WHERE recipe_id IN (SELECT id FROM recipes WHERE tenant_id = ?)", tenantId);
            jdbcTemplate.update("DELETE FROM recipes WHERE tenant_id = ?", tenantId);
            jdbcTemplate.update("UPDATE purchase_items SET product_id = NULL WHERE product_id IN (SELECT id FROM products WHERE tenant_id = ?)", tenantId);
            jdbcTemplate.update("DELETE FROM stock_movements WHERE product_id IN (SELECT id FROM products WHERE tenant_id = ?)", tenantId);
            jdbcTemplate.update("DELETE FROM stock_items WHERE product_id IN (SELECT id FROM products WHERE tenant_id = ?)", tenantId);

            // 3. Products
            int products = jdbcTemplate.update("DELETE FROM products WHERE tenant_id = ?", tenantId);

            // 4. Categories (clean hierarchy first)
            jdbcTemplate.update("UPDATE categories SET parent_id = NULL WHERE tenant_id = ?", tenantId);
            int categories = jdbcTemplate.update("DELETE FROM categories WHERE tenant_id = ?", tenantId);

            // 5. Kitchens & Assignments (detach users, preserve users & printers)
            jdbcTemplate.update("UPDATE users SET kitchen_id = NULL WHERE kitchen_id IS NOT NULL AND tenant_id = ?", tenantId);
            jdbcTemplate.update("DELETE FROM employee_kitchens WHERE tenant_id = ?", tenantId);
            jdbcTemplate.update("DELETE FROM printer_assignments WHERE kitchen_id IS NOT NULL AND tenant_id = ?", tenantId);
            int kitchens = jdbcTemplate.update("DELETE FROM kitchens WHERE tenant_id = ?", tenantId);

            // 6. Tables & Zones
            int tables = jdbcTemplate.update("DELETE FROM restaurant_tables WHERE tenant_id = ?", tenantId);
            int zones = jdbcTemplate.update("DELETE FROM table_zones WHERE tenant_id = ?", tenantId);

            // Count preserved entities
            Integer preservedUsers = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM users WHERE tenant_id = ?", Integer.class, tenantId);
            Integer preservedPrinters = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM printers WHERE tenant_id = ?", Integer.class, tenantId);
            Integer preservedRoles = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM roles WHERE tenant_id = ?", Integer.class, tenantId);

            // Log critical audit event
            auditLogService.logChange(tenantId, userId, "RESET", "ALL", null, null,
                    String.format("FULL RESET: %d orders, %d items, %d payments, %d products, %d categories, %d kitchens, %d tables, %d zones",
                            orders, orderItems, payments, products, categories, kitchens, tables, zones),
                    "Barcha test ma'lumotlari tozalandi");

            // Notify WebSocket listeners
            try {
                wsNotification.notifyOrderStatusChanged(tenantId, null);
            } catch (Exception e) {
                log.warn("Failed to send WS notification after full reset: {}", e.getMessage());
            }

            return ResetDto.AllResetResult.builder()
                    .orders(orders)
                    .orderItems(orderItems)
                    .payments(payments)
                    .kitchenBatches(kitchenBatches)
                    .kitchenTickets(kitchenTickets)
                    .cancellationReceipts(cancellationReceipts)
                    .products(products)
                    .categories(categories)
                    .kitchens(kitchens)
                    .tables(tables)
                    .zones(zones)
                    .usersPreserved(preservedUsers != null ? preservedUsers : 0)
                    .printersPreserved(preservedPrinters != null ? preservedPrinters : 0)
                    .rolesPreserved(preservedRoles != null ? preservedRoles : 0)
                    .build();

        } catch (DataIntegrityViolationException ex) {
            log.error("Foreign key violation during full reset: {}", ex.getMessage(), ex);
            throw PosException.badRequest("Hammasini tozalashda xatolik yuz berdi: " + ex.getMostSpecificCause().getMessage());
        }
    }
}
