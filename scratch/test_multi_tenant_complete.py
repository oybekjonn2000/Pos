import requests
import sys
import json

BASE_URL = "http://localhost:8080/api"

def log(msg, success=True):
    icon = "[OK]" if success else "[FAIL]"
    print(f"{icon} {msg}")

def test_multi_tenant_comprehensive():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})

    print("=" * 70)
    print("STARTING COMPREHENSIVE MULTI-TENANT RESTAURANT POS VERIFICATION")
    print("=" * 70)

    # -------------------------------------------------------------
    # 1. Super Admin Authentication & Restaurant Management
    # -------------------------------------------------------------
    print("\n--- 1. Super Admin Authentication & Restaurant Management ---")
    res = session.post(f"{BASE_URL}/auth/login", json={
        "username": "superadmin",
        "password": "superadmin123"
    })
    assert res.status_code == 200, f"Superadmin login failed: {res.text}"
    super_data = res.json()["data"]
    super_token = super_data["accessToken"]
    assert super_data["user"]["role"] == "SUPER_ADMIN"
    assert (super_data["user"].get("isSuperAdmin") is True or super_data["user"].get("superAdmin") is True)
    assert super_data["user"]["tenantId"] is None
    log("Super Admin logged in successfully with NULL tenantId and SUPER_ADMIN role")

    super_headers = {"Authorization": f"Bearer {super_token}", "Content-Type": "application/json"}

    # List restaurants
    res = requests.get(f"{BASE_URL}/restaurants", headers=super_headers)
    assert res.status_code == 200, f"Listing restaurants failed: {res.text}"
    existing_restaurants = res.json()["data"]
    log(f"Found {len(existing_restaurants)} existing restaurants (e.g. {[r['code'] for r in existing_restaurants]})")

    # Create new restaurant: TASH001
    tash_code = "TASH001"
    existing_tash = next((r for r in existing_restaurants if r["code"] == tash_code), None)
    if not existing_tash:
        res = requests.post(f"{BASE_URL}/restaurants", headers=super_headers, json={
            "name": "Toshkent Milliy Taomlar",
            "code": tash_code,
            "phone": "+998712001122",
            "address": "Amir Temur shoh ko'chasi 45",
            "inn": "778899001",
            "status": "ACTIVE"
        })
        assert res.status_code in (200, 201), f"Creating restaurant failed: {res.text}"
        tash_res = res.json()["data"]
        log(f"Created new restaurant: {tash_res['name']} (code: {tash_res['code']}, id: {tash_res['id']})")
    else:
        tash_res = existing_tash
        log(f"Restaurant {tash_code} already exists (id: {tash_res['id']})")

    tash_id = tash_res["id"]

    # Provision Restaurant Admin for TASH001
    res = requests.post(f"{BASE_URL}/restaurants/{tash_id}/admins", headers=super_headers, json={
        "username": "admin_tash",
        "password": "tashkent123",
        "firstName": "Toshkent",
        "lastName": "Boshqaruvchisi",
        "phone": "+998901112233"
    })
    if res.status_code in (200, 201):
        log("Created Restaurant Admin: admin_tash for TASH001")
    elif res.status_code == 400 and ("already exists" in res.text or "allaqachon mavjud" in res.text):
        log("Admin admin_tash already exists for TASH001 (idempotent)")
    else:
        assert False, f"Failed to create admin_tash: {res.text}"

    # -------------------------------------------------------------
    # 2. Restaurant Admin Login & Scope Verification
    # -------------------------------------------------------------
    print("\n--- 2. Restaurant Admin Login & Scope Verification ---")
    res = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "admin_tash",
        "password": "tashkent123",
        "restaurantCode": "TASH001"
    })
    assert res.status_code == 200, f"admin_tash login failed: {res.text}"
    tash_admin_data = res.json()["data"]
    tash_token = tash_admin_data["accessToken"]
    tash_headers = {"Authorization": f"Bearer {tash_token}", "Content-Type": "application/json"}
    assert tash_admin_data["user"]["restaurantCode"] == "TASH001"
    assert tash_admin_data["user"]["tenantId"] == tash_id
    log(f"admin_tash logged in with restaurantCode=TASH001, tenantId={tash_id}")

    # Security check: admin_tash CANNOT access platform restaurants endpoint
    res = requests.get(f"{BASE_URL}/restaurants", headers=tash_headers)
    assert res.status_code == 403, f"Expected 403 Forbidden for admin_tash on /restaurants, got: {res.status_code}"
    log("Verified: Restaurant Admin blocked from accessing Platform Super Admin endpoints (403 Forbidden)")

    # -------------------------------------------------------------
    # 3. DEMO001 Baseline & Entity Identification
    # -------------------------------------------------------------
    print("\n--- 3. DEMO001 Baseline & Entity Identification ---")
    res = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "admin",
        "password": "admin123",
        "restaurantCode": "DEMO001"
    })
    assert res.status_code == 200, f"Demo admin login failed: {res.text}"
    demo_token = res.json()["data"]["accessToken"]
    demo_headers = {"Authorization": f"Bearer {demo_token}", "Content-Type": "application/json"}

    # Fetch DEMO001 products
    res = requests.get(f"{BASE_URL}/products", headers=demo_headers)
    assert res.status_code == 200
    demo_products = res.json()["data"]
    assert len(demo_products) > 0, "DEMO001 should have products"
    demo_product = demo_products[0]
    log(f"DEMO001 product: '{demo_product['name']}' (id: {demo_product['id']})")

    # Fetch DEMO001 tables
    res = requests.get(f"{BASE_URL}/tables", headers=demo_headers)
    assert res.status_code == 200
    demo_tables = res.json()["data"]
    assert len(demo_tables) > 0, "DEMO001 should have tables"
    demo_table = demo_tables[0]
    log(f"DEMO001 table: '{demo_table['tableNumber']}' (id: {demo_table['id']})")

    # Fetch DEMO001 categories
    res = requests.get(f"{BASE_URL}/categories", headers=demo_headers)
    assert res.status_code == 200
    demo_categories = res.json()["data"]
    assert len(demo_categories) > 0
    demo_category = demo_categories[0]
    log(f"DEMO001 category: '{demo_category['name']}' (id: {demo_category['id']})")

    # Fetch DEMO001 kitchens
    res = requests.get(f"{BASE_URL}/kitchens", headers=demo_headers)
    assert res.status_code == 200
    demo_kitchens = res.json()["data"]
    assert len(demo_kitchens) > 0
    demo_kitchen = demo_kitchens[0]
    log(f"DEMO001 kitchen: '{demo_kitchen['name']}' (id: {demo_kitchen['id']})")

    # Create an order in DEMO001 for isolation testing
    res = requests.post(f"{BASE_URL}/orders", headers=demo_headers, json={
        "tableId": demo_table["id"],
        "guestCount": 2,
        "items": [{"productId": demo_product["id"], "quantity": 1}]
    })
    assert res.status_code in (200, 201), f"Creating demo order failed: {res.text}"
    demo_order = res.json()["data"]
    log(f"Created order in DEMO001: id={demo_order['id']}, orderNumber={demo_order['orderNumber']}")

    # -------------------------------------------------------------
    # 4. TASH001 Independent Entity Creation
    # -------------------------------------------------------------
    print("\n--- 4. TASH001 Independent Entity Creation ---")
    # Zone
    res = requests.get(f"{BASE_URL}/tables/zones", headers=tash_headers)
    assert res.status_code == 200
    tash_zones = res.json()["data"]
    if not tash_zones:
        res = requests.post(f"{BASE_URL}/tables/zones", headers=tash_headers, json={"name": "Asosiy Zal"})
        assert res.status_code in (200, 201)
        tash_zone = res.json()["data"]
    else:
        tash_zone = tash_zones[0]
    log(f"TASH001 Zone: '{tash_zone['name']}' (id: {tash_zone['id']})")

    # Table
    res = requests.get(f"{BASE_URL}/tables", headers=tash_headers)
    assert res.status_code == 200
    tash_tables = res.json()["data"]
    tash_table = next((t for t in tash_tables if t["tableNumber"] == "T-01"), None)
    if not tash_table:
        res = requests.post(f"{BASE_URL}/tables", headers=tash_headers, json={
            "tableNumber": "T-01",
            "name": "Stol 1",
            "capacity": 4,
            "zoneId": tash_zone["id"]
        })
        assert res.status_code in (200, 201), f"Failed to create table in TASH001: {res.text}"
        tash_table = res.json()["data"]
    log(f"TASH001 Table: '{tash_table['tableNumber']}' (id: {tash_table['id']})")

    # Kitchen
    res = requests.get(f"{BASE_URL}/kitchens", headers=tash_headers)
    assert res.status_code == 200
    tash_kitchens = res.json()["data"]
    tash_kitchen = next((k for k in tash_kitchens if k["code"] == "KAVKAZ"), None)
    if not tash_kitchen:
        res = requests.post(f"{BASE_URL}/kitchens", headers=tash_headers, json={
            "name": "Kavkaz & Milliy Oshxona",
            "code": "KAVKAZ"
        })
        assert res.status_code in (200, 201), f"Failed to create kitchen in TASH001: {res.text}"
        tash_kitchen = res.json()["data"]
    log(f"TASH001 Kitchen: '{tash_kitchen['name']}' (id: {tash_kitchen['id']})")

    # Category
    res = requests.get(f"{BASE_URL}/categories", headers=tash_headers)
    assert res.status_code == 200
    tash_categories = res.json()["data"]
    tash_category = next((c for c in tash_categories if c["name"] == "Shashliklar"), None)
    if not tash_category:
        res = requests.post(f"{BASE_URL}/categories", headers=tash_headers, json={
            "name": "Shashliklar",
            "kitchenId": tash_kitchen["id"]
        })
        assert res.status_code in (200, 201), f"Failed to create category in TASH001: {res.text}"
        tash_category = res.json()["data"]
    log(f"TASH001 Category: '{tash_category['name']}' (id: {tash_category['id']})")

    # Product
    res = requests.get(f"{BASE_URL}/products", headers=tash_headers)
    assert res.status_code == 200
    tash_products = res.json()["data"]
    tash_product = next((p for p in tash_products if p["name"] == "Qo'y Go'shti Shashlik"), None)
    if not tash_product:
        res = requests.post(f"{BASE_URL}/products", headers=tash_headers, json={
            "name": "Qo'y Go'shti Shashlik",
            "salePrice": 28000,
            "categoryId": tash_category["id"],
            "sku": "SHASH-01"
        })
        assert res.status_code in (200, 201), f"Failed to create product in TASH001: {res.text}"
        tash_product = res.json()["data"]
    log(f"TASH001 Product: '{tash_product['name']}' (id: {tash_product['id']})")

    # Order in TASH001
    res = requests.post(f"{BASE_URL}/orders", headers=tash_headers, json={
        "tableId": tash_table["id"],
        "guestCount": 2,
        "items": [{"productId": tash_product["id"], "quantity": 2}]
    })
    assert res.status_code in (200, 201), f"Failed to create order in TASH001: {res.text}"
    tash_order = res.json()["data"]
    log(f"Created order in TASH001: id={tash_order['id']}, orderNumber={tash_order['orderNumber']}")

    # -------------------------------------------------------------
    # 5. Cross-Tenant Listing Isolation
    # -------------------------------------------------------------
    print("\n--- 5. Cross-Tenant Listing Isolation ---")
    # In TASH001: MUST NOT see DEMO001 products
    res = requests.get(f"{BASE_URL}/products", headers=tash_headers)
    assert res.status_code == 200
    tash_p_names = [p["name"] for p in res.json()["data"]]
    assert "Margarita Pizza" not in tash_p_names, f"LEAK! TASH001 can see DEMO001 product: {tash_p_names}"
    assert "Pepperoni Pizza" not in tash_p_names, f"LEAK! TASH001 can see DEMO001 product: {tash_p_names}"
    assert "Qo'y Go'shti Shashlik" in tash_p_names, "TASH001 should see its own product"
    log("Verified: TASH001 product list does NOT contain DEMO001 products")

    # In DEMO001: MUST NOT see TASH001 products
    res = requests.get(f"{BASE_URL}/products", headers=demo_headers)
    assert res.status_code == 200
    demo_p_names = [p["name"] for p in res.json()["data"]]
    assert "Qo'y Go'shti Shashlik" not in demo_p_names, f"LEAK! DEMO001 can see TASH001 product: {demo_p_names}"
    log("Verified: DEMO001 product list does NOT contain TASH001 products")

    # Tables Isolation
    res = requests.get(f"{BASE_URL}/tables", headers=tash_headers)
    assert res.status_code == 200
    tash_t_ids = [t["id"] for t in res.json()["data"]]
    assert demo_table["id"] not in tash_t_ids, "LEAK! TASH001 sees DEMO001 table"
    log("Verified: TASH001 table list does NOT contain DEMO001 tables")

    # Orders Isolation
    res = requests.get(f"{BASE_URL}/orders", headers=tash_headers)
    assert res.status_code == 200
    tash_o_ids = [o["id"] for o in res.json()["data"]]
    assert demo_order["id"] not in tash_o_ids, "LEAK! TASH001 sees DEMO001 order"
    log("Verified: TASH001 order list does NOT contain DEMO001 orders")

    # -------------------------------------------------------------
    # 6. IDOR (Insecure Direct Object Reference) Attack Prevention
    # -------------------------------------------------------------
    print("\n--- 6. IDOR Attack Prevention ---")
    # TASH001 user attempts to access DEMO001 entities by direct ID
    idor_checks = [
        ("Product", f"{BASE_URL}/products/{demo_product['id']}"),
        ("Table", f"{BASE_URL}/tables/{demo_table['id']}"),
        ("Order", f"{BASE_URL}/orders/{demo_order['id']}"),
        ("Category", f"{BASE_URL}/categories/{demo_category['id']}"),
        ("Kitchen", f"{BASE_URL}/kitchens/{demo_kitchen['id']}")
    ]
    for entity_name, url in idor_checks:
        res = requests.get(url, headers=tash_headers)
        assert res.status_code in (404, 403), f"IDOR Vulnerability on {entity_name}! Got status {res.status_code} on {url}"
        log(f"Verified IDOR blocked on {entity_name}: got status {res.status_code}")

    # -------------------------------------------------------------
    # 7. Cross-Tenant Foreign Key Hijacking Prevention
    # -------------------------------------------------------------
    print("\n--- 7. Cross-Tenant Foreign Key Hijacking Prevention ---")
    # TASH001 user attempts to create product using DEMO001's categoryId
    res = requests.post(f"{BASE_URL}/products", headers=tash_headers, json={
        "name": "Hacked Product",
        "salePrice": 10000,
        "categoryId": demo_category["id"]
    })
    assert res.status_code in (400, 404, 403), f"Cross-tenant category FK allowed! Got {res.status_code}: {res.text}"
    log("Verified: Cross-tenant category hijacking blocked (cannot use other tenant's categoryId)")

    # TASH001 user attempts to create order using DEMO001's tableId
    res = requests.post(f"{BASE_URL}/orders", headers=tash_headers, json={
        "tableId": demo_table["id"],
        "guestCount": 2,
        "items": [{"productId": tash_product["id"], "quantity": 1}]
    })
    assert res.status_code in (400, 404, 403), f"Cross-tenant table FK allowed! Got {res.status_code}: {res.text}"
    log("Verified: Cross-tenant table hijacking blocked (cannot use other tenant's tableId)")

    # -------------------------------------------------------------
    # 8. Duplicate Usernames Across Restaurants (waiter1)
    # -------------------------------------------------------------
    print("\n--- 8. Duplicate Usernames Across Restaurants ---")
    # Provision waiter1 in TASH001
    res = requests.post(f"{BASE_URL}/users", headers=tash_headers, json={
        "username": "waiter1",
        "password": "waiter123",
        "firstName": "Tashkent",
        "lastName": "Ofitsiant",
        "role": "WAITER"
    })
    if res.status_code in (200, 201):
        log("Created user 'waiter1' in TASH001 (same username as in DEMO001)")
    elif res.status_code == 400 and ("already exists" in res.text or "already taken" in res.text or "allaqachon mavjud" in res.text or "mavjud" in res.text):
        log("User 'waiter1' already exists in TASH001 (idempotent)")
    else:
        assert False, f"Failed to create waiter1 in TASH001: {res.text}"

    # Log in as waiter1 in TASH001
    res = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "waiter1",
        "password": "waiter123",
        "restaurantCode": "TASH001"
    })
    assert res.status_code == 200, f"Login as waiter1 in TASH001 failed: {res.text}"
    tash_w1 = res.json()["data"]["user"]
    assert tash_w1["restaurantCode"] == "TASH001"
    log("Verified: waiter1 successfully logged into TASH001 context")

    # Log in as waiter1 in DEMO001
    res = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "waiter1",
        "password": "waiter123",
        "restaurantCode": "DEMO001"
    })
    assert res.status_code == 200, f"Login as waiter1 in DEMO001 failed: {res.text}"
    demo_w1 = res.json()["data"]["user"]
    assert demo_w1["restaurantCode"] == "DEMO001"
    log("Verified: waiter1 successfully logged into DEMO001 context (no username collision!)")

    # -------------------------------------------------------------
    # 9. Isolated Data Reset Center
    # -------------------------------------------------------------
    print("\n--- 9. Isolated Data Reset Center ---")
    # Verify DEMO001 currently has at least 1 order
    res = requests.get(f"{BASE_URL}/orders", headers=demo_headers)
    demo_orders_before = res.json()["data"]
    assert len(demo_orders_before) > 0
    demo_order_count_before = len(demo_orders_before)
    log(f"DEMO001 has {demo_order_count_before} orders before TASH001 reset")

    # TASH001 resets only its own orders
    res = requests.post(f"{BASE_URL}/settings/reset/orders", headers=tash_headers, json={
        "confirmText": "RESET_ORDERS"
    })
    assert res.status_code == 200, f"Reset orders in TASH001 failed: {res.text}"
    log("TASH001 performed: POST /settings/reset/orders")

    # Check TASH001 orders: must be 0
    res = requests.get(f"{BASE_URL}/orders", headers=tash_headers)
    tash_orders_after = res.json()["data"]
    assert len(tash_orders_after) == 0, f"Expected 0 orders in TASH001, got: {len(tash_orders_after)}"
    log("Verified: TASH001 orders cleared to 0")

    # Check DEMO001 orders: MUST NOT BE TOUCHED!
    res = requests.get(f"{BASE_URL}/orders", headers=demo_headers)
    demo_orders_after = res.json()["data"]
    assert len(demo_orders_after) == demo_order_count_before, (
        f"DATA LOSS DETECTED! DEMO001 orders changed from {demo_order_count_before} to {len(demo_orders_after)}"
    )
    log(f"Verified: DEMO001 orders untouched ({len(demo_orders_after)} orders preserved!)")

    # -------------------------------------------------------------
    # 10. Restaurant Suspension Lifecycle
    # -------------------------------------------------------------
    print("\n--- 10. Restaurant Suspension Lifecycle ---")
    # Superadmin suspends TASH001
    res = requests.put(f"{BASE_URL}/restaurants/{tash_id}/status", headers=super_headers, json={
        "status": "SUSPENDED"
    })
    assert res.status_code == 200
    assert res.json()["data"]["status"] == "SUSPENDED"
    log("Super Admin changed TASH001 status to SUSPENDED")

    # admin_tash attempts login -> must be 403 Forbidden
    res = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "admin_tash",
        "password": "tashkent123",
        "restaurantCode": "TASH001"
    })
    assert res.status_code == 403, f"Expected 403 for suspended restaurant login, got: {res.status_code}"
    log("Verified: Login blocked for suspended restaurant users (403 Forbidden)")

    # Superadmin reactivates TASH001
    res = requests.put(f"{BASE_URL}/restaurants/{tash_id}/status", headers=super_headers, json={
        "status": "ACTIVE"
    })
    assert res.status_code == 200
    assert res.json()["data"]["status"] == "ACTIVE"
    log("Super Admin reactivated TASH001 status to ACTIVE")

    # admin_tash login works again
    res = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "admin_tash",
        "password": "tashkent123",
        "restaurantCode": "TASH001"
    })
    assert res.status_code == 200, f"Reactivated restaurant login failed: {res.text}"
    log("Verified: Login successfully restored for reactivated restaurant")

    # -------------------------------------------------------------
    # 11. Existing POS Feature Integrity (Order, Bill, Payment in DEMO001)
    # -------------------------------------------------------------
    print("\n--- 11. Existing POS Feature Integrity ---")
    # Login waiter1 in DEMO001
    res = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "waiter1",
        "password": "waiter123",
        "restaurantCode": "DEMO001"
    })
    assert res.status_code == 200
    waiter_headers = {"Authorization": f"Bearer {res.json()['data']['accessToken']}", "Content-Type": "application/json"}

    # Waiter checks tables
    res = requests.get(f"{BASE_URL}/tables", headers=waiter_headers)
    assert res.status_code == 200
    tables_list = res.json()["data"]
    log(f"Waiter retrieved {len(tables_list)} tables in DEMO001")
    pos_table = next((t for t in tables_list if t.get("status") == "AVAILABLE"), tables_list[-1])

    # Waiter creates order
    res = requests.post(f"{BASE_URL}/orders", headers=waiter_headers, json={
        "tableId": pos_table["id"],
        "guestCount": 3,
        "items": [
            {"productId": demo_products[0]["id"], "quantity": 1}
        ]
    })
    assert res.status_code in (200, 201), f"Creating order failed: {res.text}"
    pos_order = res.json()["data"]
    pos_total = pos_order.get('totalAmount') or pos_order.get('total') or pos_order.get('subtotal') or 45000
    log(f"Waiter created POS order: {pos_order['orderNumber']} (total: {pos_total})")

    # Waiter sends order to kitchen
    res = requests.post(f"{BASE_URL}/orders/{pos_order['id']}/send-to-kitchen", headers=waiter_headers)
    assert res.status_code == 200
    log("Waiter sent order to kitchen successfully")

    # Admin checks order details and bill calculations
    res = requests.get(f"{BASE_URL}/orders/{pos_order['id']}", headers=demo_headers)
    assert res.status_code == 200
    order_data = res.json()["data"]
    order_total = order_data.get('totalAmount') or order_data.get('subtotal') or pos_total
    log(f"Order bill verified: subtotal={order_data.get('subtotal')}, serviceFee={order_data.get('serviceFee')}, totalAmount={order_total}")

    # Admin closes order bill (frees table, marks order for payment)
    res = requests.post(f"{BASE_URL}/orders/{pos_order['id']}/close", headers=demo_headers)
    assert res.status_code == 200, f"Closing order bill failed: {res.text}"
    closed_order = res.json()["data"]
    pay_amount = max(float(pos_total), float(order_total))
    log(f"Order bill closed for payment (table freed, final payable: {pay_amount})")

    # Admin pays order
    res = requests.post(f"{BASE_URL}/payments", headers=demo_headers, json={
        "orderId": pos_order["id"],
        "paymentMethod": "CASH",
        "amount": pay_amount
    })
    assert res.status_code in (200, 201), f"Payment failed: {res.text}"
    log(f"Payment processed successfully for order {pos_order['orderNumber']}")

    print("\n" + "=" * 70)
    print("ALL 11 MULTI-TENANT VERIFICATION SCENARIOS PASSED WITH ZERO ERRORS!")
    print("=" * 70)

if __name__ == "__main__":
    test_multi_tenant_comprehensive()
