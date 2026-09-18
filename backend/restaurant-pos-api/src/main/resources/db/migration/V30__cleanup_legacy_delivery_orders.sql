-- V30: Clean up any remaining legacy delivery orders and related batches/items
DELETE FROM kitchen_order_batch_items WHERE batch_id IN (
    SELECT id FROM kitchen_order_batches WHERE order_id IN (
        SELECT id FROM orders WHERE order_type = 'DELIVERY'
    )
);

DELETE FROM kitchen_order_batches WHERE order_id IN (
    SELECT id FROM orders WHERE order_type = 'DELIVERY'
);

DELETE FROM cancellation_receipts WHERE order_id IN (
    SELECT id FROM orders WHERE order_type = 'DELIVERY'
);

DELETE FROM payments WHERE order_id IN (
    SELECT id FROM orders WHERE order_type = 'DELIVERY'
);

DELETE FROM order_items WHERE order_id IN (
    SELECT id FROM orders WHERE order_type = 'DELIVERY'
);

DELETE FROM orders WHERE order_type = 'DELIVERY';
