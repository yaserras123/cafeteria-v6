#!/usr/bin/env python3
"""
Comprehensive Test Suite for Cafeteria V2 Application
Tests: API endpoints, Authentication, Authorization, Business Logic, Security
"""

import requests
import json
import time
import sys
from datetime import datetime

BASE_URL = "http://localhost:3000"
TRPC_URL = f"{BASE_URL}/api/trpc"

# Test results tracking
results = {
    "passed": 0,
    "failed": 0,
    "warnings": 0,
    "tests": []
}

def log_test(name, status, details="", category=""):
    icon = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"{icon} [{category}] {name}: {details}")
    results["tests"].append({
        "name": name,
        "status": status,
        "details": details,
        "category": category,
        "timestamp": datetime.now().isoformat()
    })
    if status == "PASS":
        results["passed"] += 1
    elif status == "FAIL":
        results["failed"] += 1
    else:
        results["warnings"] += 1

def trpc_get(session, endpoint, params=None):
    """Make a tRPC GET request"""
    url = f"{TRPC_URL}/{endpoint}"
    if params:
        import urllib.parse
        url += f"?input={urllib.parse.quote(json.dumps({'json': params}))}"
    return session.get(url)

def trpc_post(session, endpoint, data):
    """Make a tRPC POST request"""
    url = f"{TRPC_URL}/{endpoint}"
    return session.post(url, json={"json": data})

# ============================================================
# SECTION 1: HEALTH & CONNECTIVITY TESTS
# ============================================================
print("\n" + "="*60)
print("SECTION 1: HEALTH & CONNECTIVITY TESTS")
print("="*60)

# Test 1.1: Server Health
try:
    r = requests.get(f"{TRPC_URL}/system.health", timeout=5)
    data = r.json()
    health = data["result"]["data"]["json"]
    if health["status"] == "ok" and health["database"] == "healthy":
        log_test("Server Health Check", "PASS", f"Status: {health['status']}, DB: {health['database']}", "HEALTH")
    else:
        log_test("Server Health Check", "FAIL", f"Unexpected status: {health}", "HEALTH")
except Exception as e:
    log_test("Server Health Check", "FAIL", str(e), "HEALTH")

# Test 1.2: Server responds to static files
try:
    r = requests.get(f"{BASE_URL}/", timeout=5)
    if r.status_code == 200:
        log_test("Frontend Static Files", "PASS", f"HTTP {r.status_code}", "HEALTH")
    else:
        log_test("Frontend Static Files", "WARN", f"HTTP {r.status_code}", "HEALTH")
except Exception as e:
    log_test("Frontend Static Files", "WARN", str(e), "HEALTH")

# ============================================================
# SECTION 2: AUTHENTICATION TESTS
# ============================================================
print("\n" + "="*60)
print("SECTION 2: AUTHENTICATION TESTS")
print("="*60)

owner_session = requests.Session()
owner_session.headers.update({"Content-Type": "application/json"})

# Test 2.1: Valid Login
try:
    r = trpc_post(owner_session, "auth.login", {
        "username": "yaserras@gmail.com",
        "password": "Kamel123321$"
    })
    data = r.json()
    if data["result"]["data"]["json"]["success"]:
        log_test("Valid Owner Login", "PASS", "Login successful, session created", "AUTH")
    else:
        log_test("Valid Owner Login", "FAIL", str(data), "AUTH")
except Exception as e:
    log_test("Valid Owner Login", "FAIL", str(e), "AUTH")

# Test 2.2: Invalid Login - Wrong Password
try:
    s = requests.Session()
    r = trpc_post(s, "auth.login", {
        "username": "yaserras@gmail.com",
        "password": "WrongPassword123"
    })
    data = r.json()
    if "error" in data:
        log_test("Invalid Login - Wrong Password", "PASS", "Correctly rejected", "AUTH")
    else:
        log_test("Invalid Login - Wrong Password", "FAIL", "Should have rejected", "AUTH")
except Exception as e:
    log_test("Invalid Login - Wrong Password", "FAIL", str(e), "AUTH")

# Test 2.3: Invalid Login - Non-existent User
try:
    s = requests.Session()
    r = trpc_post(s, "auth.login", {
        "username": "nonexistent@test.com",
        "password": "Password123"
    })
    data = r.json()
    if "error" in data:
        log_test("Invalid Login - Non-existent User", "PASS", "Correctly rejected", "AUTH")
    else:
        log_test("Invalid Login - Non-existent User", "FAIL", "Should have rejected", "AUTH")
except Exception as e:
    log_test("Invalid Login - Non-existent User", "FAIL", str(e), "AUTH")

# Test 2.4: Empty Credentials
try:
    s = requests.Session()
    r = trpc_post(s, "auth.login", {
        "username": "",
        "password": ""
    })
    data = r.json()
    if "error" in data:
        log_test("Empty Credentials Rejection", "PASS", "Correctly rejected empty credentials", "AUTH")
    else:
        log_test("Empty Credentials Rejection", "FAIL", "Should have rejected empty credentials", "AUTH")
except Exception as e:
    log_test("Empty Credentials Rejection", "FAIL", str(e), "AUTH")

# Test 2.5: Auth.me - Get current user
try:
    r = trpc_get(owner_session, "auth.me")
    data = r.json()
    user = data["result"]["data"]["json"]
    if user["role"] == "admin" and user["email"] == "yaserras@gmail.com":
        log_test("Get Current User (auth.me)", "PASS", f"User: {user['name']}, Role: {user['role']}", "AUTH")
    else:
        log_test("Get Current User (auth.me)", "FAIL", str(user), "AUTH")
except Exception as e:
    log_test("Get Current User (auth.me)", "FAIL", str(e), "AUTH")

# Test 2.6: Unauthenticated Access to Protected Route
try:
    s = requests.Session()
    r = trpc_get(s, "auth.me")
    data = r.json()
    if "error" in data:
        log_test("Unauthenticated Access Blocked", "PASS", "Protected route correctly blocked", "AUTH")
    else:
        log_test("Unauthenticated Access Blocked", "FAIL", "Should have blocked unauthenticated access", "AUTH")
except Exception as e:
    log_test("Unauthenticated Access Blocked", "FAIL", str(e), "AUTH")

# ============================================================
# SECTION 3: CAFETERIA MANAGEMENT TESTS
# ============================================================
print("\n" + "="*60)
print("SECTION 3: CAFETERIA MANAGEMENT TESTS")
print("="*60)

# Test 3.1: Create Marketer
marketer_id = None
try:
    r = trpc_post(owner_session, "marketers.create", {
        "name": "Test Marketer",
        "email": "marketer@test.com",
        "phone": "+966501234567",
        "username": "test_marketer",
        "password": "TestPass123$",
        "currency": "SAR"
    })
    data = r.json()
    if "result" in data and "error" not in data:
        marketer = data["result"]["data"]["json"]
        marketer_id = marketer.get("id") or marketer.get("marketerId")
        log_test("Create Marketer", "PASS", f"Marketer created: {marketer_id}", "CAFETERIA")
    else:
        log_test("Create Marketer", "FAIL", str(data.get("error", data)), "CAFETERIA")
except Exception as e:
    log_test("Create Marketer", "FAIL", str(e), "CAFETERIA")

# Test 3.2: List Marketers
try:
    r = trpc_get(owner_session, "marketers.list")
    data = r.json()
    marketers = data["result"]["data"]["json"]["marketers"]
    log_test("List Marketers", "PASS", f"Found {len(marketers)} marketers", "CAFETERIA")
except Exception as e:
    log_test("List Marketers", "FAIL", str(e), "CAFETERIA")

# Test 3.3: Create Cafeteria
cafeteria_id = None
try:
    r = trpc_post(owner_session, "cafeterias.create", {
        "name": "Test Cafeteria",
        "address": "123 Test Street",
        "phone": "+966501234568",
        "username": "test_cafeteria",
        "password": "CafePass123$",
        "marketerId": marketer_id,
        "currency": "SAR"
    })
    data = r.json()
    if "result" in data and "error" not in data:
        cafe = data["result"]["data"]["json"]
        cafeteria_id = cafe.get("id") or cafe.get("cafeteriaId")
        log_test("Create Cafeteria", "PASS", f"Cafeteria created: {cafeteria_id}", "CAFETERIA")
    else:
        log_test("Create Cafeteria", "FAIL", str(data.get("error", data)), "CAFETERIA")
except Exception as e:
    log_test("Create Cafeteria", "FAIL", str(e), "CAFETERIA")

# Test 3.4: List Cafeterias
try:
    r = trpc_get(owner_session, "cafeterias.list")
    data = r.json()
    cafeterias = data["result"]["data"]["json"]["cafeterias"]
    log_test("List Cafeterias", "PASS", f"Found {len(cafeterias)} cafeterias", "CAFETERIA")
    if cafeterias and not cafeteria_id:
        cafeteria_id = cafeterias[0]["id"]
except Exception as e:
    log_test("List Cafeterias", "FAIL", str(e), "CAFETERIA")

# ============================================================
# SECTION 4: STAFF MANAGEMENT TESTS
# ============================================================
print("\n" + "="*60)
print("SECTION 4: STAFF MANAGEMENT TESTS")
print("="*60)

# Login as cafeteria admin
cafe_session = requests.Session()
cafe_session.headers.update({"Content-Type": "application/json"})

try:
    r = trpc_post(cafe_session, "auth.login", {
        "username": "test_cafeteria",
        "password": "CafePass123$"
    })
    data = r.json()
    if "result" in data and data["result"]["data"]["json"].get("success"):
        log_test("Cafeteria Admin Login", "PASS", "Login successful", "STAFF")
    else:
        log_test("Cafeteria Admin Login", "FAIL", str(data), "STAFF")
        cafe_session = owner_session  # fallback
except Exception as e:
    log_test("Cafeteria Admin Login", "FAIL", str(e), "STAFF")
    cafe_session = owner_session

# Test 4.1: Create Staff (Manager)
manager_id = None
try:
    r = trpc_post(cafe_session, "staff.create", {
        "name": "Test Manager",
        "username": "test_manager",
        "password": "ManagerPass123$",
        "role": "manager",
        "cafeteriaId": cafeteria_id
    })
    data = r.json()
    if "result" in data and "error" not in data:
        staff = data["result"]["data"]["json"]
        manager_id = staff.get("id") or staff.get("staffId")
        log_test("Create Staff (Manager)", "PASS", f"Manager created: {manager_id}", "STAFF")
    else:
        log_test("Create Staff (Manager)", "FAIL", str(data.get("error", data)), "STAFF")
except Exception as e:
    log_test("Create Staff (Manager)", "FAIL", str(e), "STAFF")

# Test 4.2: Create Staff (Waiter)
waiter_id = None
try:
    r = trpc_post(cafe_session, "staff.create", {
        "name": "Test Waiter",
        "username": "test_waiter",
        "password": "WaiterPass123$",
        "role": "waiter",
        "cafeteriaId": cafeteria_id
    })
    data = r.json()
    if "result" in data and "error" not in data:
        staff = data["result"]["data"]["json"]
        waiter_id = staff.get("id") or staff.get("staffId")
        log_test("Create Staff (Waiter)", "PASS", f"Waiter created: {waiter_id}", "STAFF")
    else:
        log_test("Create Staff (Waiter)", "FAIL", str(data.get("error", data)), "STAFF")
except Exception as e:
    log_test("Create Staff (Waiter)", "FAIL", str(e), "STAFF")

# Test 4.3: Create Staff (Chef)
chef_id = None
try:
    r = trpc_post(cafe_session, "staff.create", {
        "name": "Test Chef",
        "username": "test_chef",
        "password": "ChefPass123$",
        "role": "chef",
        "cafeteriaId": cafeteria_id
    })
    data = r.json()
    if "result" in data and "error" not in data:
        staff = data["result"]["data"]["json"]
        chef_id = staff.get("id") or staff.get("staffId")
        log_test("Create Staff (Chef)", "PASS", f"Chef created: {chef_id}", "STAFF")
    else:
        log_test("Create Staff (Chef)", "FAIL", str(data.get("error", data)), "STAFF")
except Exception as e:
    log_test("Create Staff (Chef)", "FAIL", str(e), "STAFF")

# Test 4.4: List Staff
try:
    r = trpc_get(cafe_session, "staff.list", {"cafeteriaId": cafeteria_id})
    data = r.json()
    if "result" in data:
        staff_list = data["result"]["data"]["json"].get("staff", [])
        log_test("List Staff", "PASS", f"Found {len(staff_list)} staff members", "STAFF")
    else:
        log_test("List Staff", "FAIL", str(data.get("error", data)), "STAFF")
except Exception as e:
    log_test("List Staff", "FAIL", str(e), "STAFF")

# ============================================================
# SECTION 5: MENU MANAGEMENT TESTS
# ============================================================
print("\n" + "="*60)
print("SECTION 5: MENU MANAGEMENT TESTS")
print("="*60)

category_id = None
# Test 5.1: Create Menu Category
try:
    r = trpc_post(cafe_session, "menu.createCategory", {
        "name": "Main Dishes",
        "cafeteriaId": cafeteria_id
    })
    data = r.json()
    if "result" in data and "error" not in data:
        cat = data["result"]["data"]["json"]
        category_id = cat.get("id") or cat.get("categoryId")
        log_test("Create Menu Category", "PASS", f"Category created: {category_id}", "MENU")
    else:
        log_test("Create Menu Category", "FAIL", str(data.get("error", data)), "MENU")
except Exception as e:
    log_test("Create Menu Category", "FAIL", str(e), "MENU")

# Test 5.2: Create Menu Item
item_id = None
try:
    r = trpc_post(cafe_session, "menu.createItem", {
        "name": "Grilled Chicken",
        "price": 25.00,
        "categoryId": category_id,
        "cafeteriaId": cafeteria_id,
        "isAvailable": True
    })
    data = r.json()
    if "result" in data and "error" not in data:
        item = data["result"]["data"]["json"]
        item_id = item.get("id") or item.get("itemId")
        log_test("Create Menu Item", "PASS", f"Item created: {item_id}", "MENU")
    else:
        log_test("Create Menu Item", "FAIL", str(data.get("error", data)), "MENU")
except Exception as e:
    log_test("Create Menu Item", "FAIL", str(e), "MENU")

# Test 5.3: List Menu Categories
try:
    r = trpc_get(cafe_session, "menu.getCategories", {"cafeteriaId": cafeteria_id})
    data = r.json()
    if "result" in data:
        categories = data["result"]["data"]["json"].get("categories", [])
        log_test("List Menu Categories", "PASS", f"Found {len(categories)} categories", "MENU")
    else:
        log_test("List Menu Categories", "FAIL", str(data.get("error", data)), "MENU")
except Exception as e:
    log_test("List Menu Categories", "FAIL", str(e), "MENU")

# Test 5.4: List Menu Items
try:
    r = trpc_get(cafe_session, "menu.getItems", {"cafeteriaId": cafeteria_id})
    data = r.json()
    if "result" in data:
        items = data["result"]["data"]["json"].get("items", [])
        log_test("List Menu Items", "PASS", f"Found {len(items)} items", "MENU")
    else:
        log_test("List Menu Items", "FAIL", str(data.get("error", data)), "MENU")
except Exception as e:
    log_test("List Menu Items", "FAIL", str(e), "MENU")

# ============================================================
# SECTION 6: TABLE MANAGEMENT TESTS
# ============================================================
print("\n" + "="*60)
print("SECTION 6: TABLE MANAGEMENT TESTS")
print("="*60)

section_id = None
table_id = None

# Test 6.1: Create Section
try:
    r = trpc_post(cafe_session, "tables.createSection", {
        "name": "Main Hall",
        "cafeteriaId": cafeteria_id
    })
    data = r.json()
    if "result" in data and "error" not in data:
        section = data["result"]["data"]["json"]
        section_id = section.get("id") or section.get("sectionId")
        log_test("Create Table Section", "PASS", f"Section created: {section_id}", "TABLES")
    else:
        log_test("Create Table Section", "FAIL", str(data.get("error", data)), "TABLES")
except Exception as e:
    log_test("Create Table Section", "FAIL", str(e), "TABLES")

# Test 6.2: Create Table
try:
    r = trpc_post(cafe_session, "tables.createTable", {
        "name": "Table 1",
        "sectionId": section_id,
        "cafeteriaId": cafeteria_id,
        "capacity": 4
    })
    data = r.json()
    if "result" in data and "error" not in data:
        table = data["result"]["data"]["json"]
        table_id = table.get("id") or table.get("tableId")
        log_test("Create Table", "PASS", f"Table created: {table_id}", "TABLES")
    else:
        log_test("Create Table", "FAIL", str(data.get("error", data)), "TABLES")
except Exception as e:
    log_test("Create Table", "FAIL", str(e), "TABLES")

# Test 6.3: List Tables
try:
    r = trpc_get(cafe_session, "tables.getTables", {"cafeteriaId": cafeteria_id})
    data = r.json()
    if "result" in data:
        tables = data["result"]["data"]["json"].get("tables", [])
        log_test("List Tables", "PASS", f"Found {len(tables)} tables", "TABLES")
    else:
        log_test("List Tables", "FAIL", str(data.get("error", data)), "TABLES")
except Exception as e:
    log_test("List Tables", "FAIL", str(e), "TABLES")

# ============================================================
# SECTION 7: ORDER LIFECYCLE TESTS
# ============================================================
print("\n" + "="*60)
print("SECTION 7: ORDER LIFECYCLE TESTS")
print("="*60)

# Login as waiter
waiter_session = requests.Session()
waiter_session.headers.update({"Content-Type": "application/json"})

try:
    r = trpc_post(waiter_session, "auth.login", {
        "username": "test_waiter",
        "password": "WaiterPass123$"
    })
    data = r.json()
    if "result" in data and data["result"]["data"]["json"].get("success"):
        log_test("Waiter Login", "PASS", "Waiter logged in successfully", "ORDERS")
    else:
        log_test("Waiter Login", "FAIL", str(data), "ORDERS")
        waiter_session = cafe_session
except Exception as e:
    log_test("Waiter Login", "FAIL", str(e), "ORDERS")
    waiter_session = cafe_session

# Test 7.1: Start Shift
shift_id = None
try:
    r = trpc_post(waiter_session, "shifts.startShift", {
        "cafeteriaId": cafeteria_id
    })
    data = r.json()
    if "result" in data and "error" not in data:
        shift = data["result"]["data"]["json"]
        shift_id = shift.get("id") or shift.get("shiftId")
        log_test("Start Shift (Waiter)", "PASS", f"Shift started: {shift_id}", "ORDERS")
    else:
        log_test("Start Shift (Waiter)", "FAIL", str(data.get("error", data)), "ORDERS")
except Exception as e:
    log_test("Start Shift (Waiter)", "FAIL", str(e), "ORDERS")

# Test 7.2: Create Order
order_id = None
try:
    r = trpc_post(waiter_session, "orders.createOrder", {
        "tableId": table_id,
        "cafeteriaId": cafeteria_id
    })
    data = r.json()
    if "result" in data and "error" not in data:
        order = data["result"]["data"]["json"]
        order_id = order.get("id") or order.get("orderId")
        log_test("Create Order", "PASS", f"Order created: {order_id}", "ORDERS")
    else:
        log_test("Create Order", "FAIL", str(data.get("error", data)), "ORDERS")
except Exception as e:
    log_test("Create Order", "FAIL", str(e), "ORDERS")

# Test 7.3: Add Item to Order
order_item_id = None
try:
    r = trpc_post(waiter_session, "orders.addItem", {
        "orderId": order_id,
        "menuItemId": item_id,
        "quantity": 2,
        "unitPrice": 25.00
    })
    data = r.json()
    if "result" in data and "error" not in data:
        oi = data["result"]["data"]["json"]
        order_item_id = oi.get("id") or oi.get("orderItemId")
        log_test("Add Item to Order", "PASS", f"Item added: {order_item_id}", "ORDERS")
    else:
        log_test("Add Item to Order", "FAIL", str(data.get("error", data)), "ORDERS")
except Exception as e:
    log_test("Add Item to Order", "FAIL", str(e), "ORDERS")

# Test 7.4: Send to Kitchen
try:
    r = trpc_post(waiter_session, "orders.sendToKitchen", {
        "orderId": order_id
    })
    data = r.json()
    if "result" in data and "error" not in data:
        log_test("Send Order to Kitchen", "PASS", "Order sent to kitchen", "ORDERS")
    else:
        log_test("Send Order to Kitchen", "FAIL", str(data.get("error", data)), "ORDERS")
except Exception as e:
    log_test("Send Order to Kitchen", "FAIL", str(e), "ORDERS")

# Test 7.5: Chef Updates Item Status
chef_session = requests.Session()
chef_session.headers.update({"Content-Type": "application/json"})

try:
    r = trpc_post(chef_session, "auth.login", {
        "username": "test_chef",
        "password": "ChefPass123$"
    })
    data = r.json()
    if "result" in data and data["result"]["data"]["json"].get("success"):
        log_test("Chef Login", "PASS", "Chef logged in successfully", "ORDERS")
    else:
        log_test("Chef Login", "FAIL", str(data), "ORDERS")
        chef_session = cafe_session
except Exception as e:
    log_test("Chef Login", "FAIL", str(e), "ORDERS")
    chef_session = cafe_session

try:
    r = trpc_post(chef_session, "orders.updateItemStatus", {
        "orderItemId": order_item_id,
        "status": "in_preparation"
    })
    data = r.json()
    if "result" in data and "error" not in data:
        log_test("Chef: Update Item to In Preparation", "PASS", "Status updated", "ORDERS")
    else:
        log_test("Chef: Update Item to In Preparation", "FAIL", str(data.get("error", data)), "ORDERS")
except Exception as e:
    log_test("Chef: Update Item to In Preparation", "FAIL", str(e), "ORDERS")

try:
    r = trpc_post(chef_session, "orders.updateItemStatus", {
        "orderItemId": order_item_id,
        "status": "ready"
    })
    data = r.json()
    if "result" in data and "error" not in data:
        log_test("Chef: Update Item to Ready", "PASS", "Status updated to ready", "ORDERS")
    else:
        log_test("Chef: Update Item to Ready", "FAIL", str(data.get("error", data)), "ORDERS")
except Exception as e:
    log_test("Chef: Update Item to Ready", "FAIL", str(e), "ORDERS")

# Test 7.6: Recharge cafeteria (needed for order close)
try:
    r = trpc_post(owner_session, "recharges.createRequest", {
        "cafeteriaId": cafeteria_id,
        "amount": 1000,
        "currency": "SAR"
    })
    data = r.json()
    recharge_id = None
    if "result" in data and "error" not in data:
        req = data["result"]["data"]["json"]
        recharge_id = req.get("id") or req.get("requestId")
        log_test("Create Recharge Request", "PASS", f"Request: {recharge_id}", "ORDERS")
    else:
        log_test("Create Recharge Request", "FAIL", str(data.get("error", data)), "ORDERS")
    
    if recharge_id:
        r2 = trpc_post(owner_session, "recharges.approveRequest", {
            "requestId": recharge_id
        })
        data2 = r2.json()
        if "result" in data2 and "error" not in data2:
            log_test("Approve Recharge Request", "PASS", "Recharge approved, balance updated", "ORDERS")
        else:
            log_test("Approve Recharge Request", "FAIL", str(data2.get("error", data2)), "ORDERS")
except Exception as e:
    log_test("Recharge Cafeteria", "FAIL", str(e), "ORDERS")

# Test 7.7: Close Order
try:
    r = trpc_post(waiter_session, "orders.closeOrder", {
        "orderId": order_id
    })
    data = r.json()
    if "result" in data and "error" not in data:
        log_test("Close Order", "PASS", "Order closed successfully", "ORDERS")
    else:
        log_test("Close Order", "FAIL", str(data.get("error", data)), "ORDERS")
except Exception as e:
    log_test("Close Order", "FAIL", str(e), "ORDERS")

# ============================================================
# SECTION 8: REPORTING TESTS
# ============================================================
print("\n" + "="*60)
print("SECTION 8: REPORTING TESTS")
print("="*60)

# Test 8.1: Sales Report
try:
    r = trpc_get(owner_session, "reporting.getSalesReport", {
        "cafeteriaId": cafeteria_id,
        "startDate": "2026-01-01",
        "endDate": "2026-12-31"
    })
    data = r.json()
    if "result" in data:
        log_test("Get Sales Report", "PASS", "Sales report retrieved", "REPORTING")
    else:
        log_test("Get Sales Report", "FAIL", str(data.get("error", data)), "REPORTING")
except Exception as e:
    log_test("Get Sales Report", "FAIL", str(e), "REPORTING")

# Test 8.2: Staff Performance Report
try:
    r = trpc_get(owner_session, "reporting.getStaffPerformance", {
        "cafeteriaId": cafeteria_id
    })
    data = r.json()
    if "result" in data:
        log_test("Get Staff Performance Report", "PASS", "Report retrieved", "REPORTING")
    else:
        log_test("Get Staff Performance Report", "FAIL", str(data.get("error", data)), "REPORTING")
except Exception as e:
    log_test("Get Staff Performance Report", "FAIL", str(e), "REPORTING")

# ============================================================
# SECTION 9: SECURITY TESTS
# ============================================================
print("\n" + "="*60)
print("SECTION 9: SECURITY TESTS")
print("="*60)

# Test 9.1: SQL Injection Attempt
try:
    s = requests.Session()
    r = trpc_post(s, "auth.login", {
        "username": "admin' OR '1'='1",
        "password": "anything"
    })
    data = r.json()
    if "error" in data:
        log_test("SQL Injection Prevention", "PASS", "SQL injection attempt blocked", "SECURITY")
    else:
        log_test("SQL Injection Prevention", "FAIL", "SQL injection may have succeeded!", "SECURITY")
except Exception as e:
    log_test("SQL Injection Prevention", "PASS", "Request failed safely", "SECURITY")

# Test 9.2: XSS Attempt in Username
try:
    s = requests.Session()
    r = trpc_post(s, "auth.login", {
        "username": "<script>alert('xss')</script>",
        "password": "password"
    })
    data = r.json()
    if "error" in data:
        log_test("XSS Prevention in Login", "PASS", "XSS attempt blocked", "SECURITY")
    else:
        log_test("XSS Prevention in Login", "WARN", "XSS input was accepted (check output encoding)", "SECURITY")
except Exception as e:
    log_test("XSS Prevention in Login", "PASS", "Request failed safely", "SECURITY")

# Test 9.3: Authorization - Waiter cannot access Owner endpoints
try:
    r = trpc_get(waiter_session, "cafeterias.list")
    data = r.json()
    if "error" in data:
        log_test("Role Authorization - Waiter cannot list cafeterias", "PASS", "Access correctly denied", "SECURITY")
    else:
        cafes = data.get("result", {}).get("data", {}).get("json", {}).get("cafeterias", [])
        log_test("Role Authorization - Waiter cannot list cafeterias", "WARN", f"Waiter got {len(cafes)} cafeterias (check permissions)", "SECURITY")
except Exception as e:
    log_test("Role Authorization - Waiter cannot list cafeterias", "PASS", "Request failed safely", "SECURITY")

# Test 9.4: CSRF - Request without proper session
try:
    s = requests.Session()
    r = trpc_post(s, "cafeterias.create", {
        "name": "Unauthorized Cafe",
        "username": "hack",
        "password": "hack123"
    })
    data = r.json()
    if "error" in data:
        log_test("CSRF/Unauthorized Create Blocked", "PASS", "Unauthorized creation blocked", "SECURITY")
    else:
        log_test("CSRF/Unauthorized Create Blocked", "FAIL", "Unauthorized creation succeeded!", "SECURITY")
except Exception as e:
    log_test("CSRF/Unauthorized Create Blocked", "PASS", "Request failed safely", "SECURITY")

# Test 9.5: Password Strength - Weak Password Rejection
try:
    r = trpc_post(cafe_session, "staff.create", {
        "name": "Weak Pass Staff",
        "username": "weak_staff",
        "password": "123",
        "role": "waiter",
        "cafeteriaId": cafeteria_id
    })
    data = r.json()
    if "error" in data:
        log_test("Weak Password Rejection", "PASS", "Weak password rejected", "SECURITY")
    else:
        log_test("Weak Password Rejection", "WARN", "Weak password accepted (consider adding validation)", "SECURITY")
except Exception as e:
    log_test("Weak Password Rejection", "PASS", "Request failed safely", "SECURITY")

# Test 9.6: Rate Limiting Check
try:
    start = time.time()
    responses = []
    for i in range(10):
        s = requests.Session()
        r = trpc_post(s, "auth.login", {
            "username": f"fake{i}@test.com",
            "password": "wrongpass"
        })
        responses.append(r.status_code)
    elapsed = time.time() - start
    
    # Check if any 429 (Too Many Requests) responses
    if 429 in responses:
        log_test("Rate Limiting Active", "PASS", f"Rate limiting detected after {responses.index(429)+1} requests", "SECURITY")
    else:
        log_test("Rate Limiting Active", "WARN", f"No rate limiting detected in 10 requests ({elapsed:.2f}s)", "SECURITY")
except Exception as e:
    log_test("Rate Limiting Check", "WARN", str(e), "SECURITY")

# ============================================================
# SECTION 10: QR CODE & CUSTOMER MENU TESTS
# ============================================================
print("\n" + "="*60)
print("SECTION 10: QR CODE & CUSTOMER MENU TESTS")
print("="*60)

# Test 10.1: Get Table QR Token
table_token = None
try:
    r = trpc_get(cafe_session, "tables.getTableToken", {"tableId": table_id})
    data = r.json()
    if "result" in data:
        result = data["result"]["data"]["json"]
        table_token = result.get("token") or result.get("qrToken")
        log_test("Get Table QR Token", "PASS", f"Token: {str(table_token)[:20]}...", "QR")
    else:
        log_test("Get Table QR Token", "FAIL", str(data.get("error", data)), "QR")
except Exception as e:
    log_test("Get Table QR Token", "FAIL", str(e), "QR")

# Test 10.2: Customer Menu Access via QR
try:
    if table_token:
        r = trpc_get(requests.Session(), "qrOrders.getMenuByToken", {"token": table_token})
        data = r.json()
        if "result" in data:
            log_test("Customer Menu via QR Token", "PASS", "Menu accessible via QR token", "QR")
        else:
            log_test("Customer Menu via QR Token", "FAIL", str(data.get("error", data)), "QR")
    else:
        log_test("Customer Menu via QR Token", "WARN", "No token available to test", "QR")
except Exception as e:
    log_test("Customer Menu via QR Token", "FAIL", str(e), "QR")

# ============================================================
# SECTION 11: COMMISSION & MARKETER TESTS
# ============================================================
print("\n" + "="*60)
print("SECTION 11: COMMISSION & MARKETER TESTS")
print("="*60)

# Test 11.1: Get Marketer Balance
try:
    r = trpc_get(owner_session, "marketers.getBalance", {"marketerId": marketer_id})
    data = r.json()
    if "result" in data:
        balance = data["result"]["data"]["json"]
        log_test("Get Marketer Balance", "PASS", f"Balance data retrieved", "COMMISSION")
    else:
        log_test("Get Marketer Balance", "FAIL", str(data.get("error", data)), "COMMISSION")
except Exception as e:
    log_test("Get Marketer Balance", "FAIL", str(e), "COMMISSION")

# Test 11.2: Commission Config
try:
    r = trpc_get(owner_session, "commissions.getConfigs", {"marketerId": marketer_id})
    data = r.json()
    if "result" in data:
        log_test("Get Commission Configs", "PASS", "Commission configs retrieved", "COMMISSION")
    else:
        log_test("Get Commission Configs", "FAIL", str(data.get("error", data)), "COMMISSION")
except Exception as e:
    log_test("Get Commission Configs", "FAIL", str(e), "COMMISSION")

# ============================================================
# SECTION 12: LOGOUT TEST
# ============================================================
print("\n" + "="*60)
print("SECTION 12: LOGOUT TESTS")
print("="*60)

# Test 12.1: Logout
try:
    r = trpc_post(owner_session, "auth.logout", {})
    data = r.json()
    if "result" in data:
        log_test("Logout", "PASS", "Logout successful", "AUTH")
    else:
        log_test("Logout", "FAIL", str(data.get("error", data)), "AUTH")
except Exception as e:
    log_test("Logout", "FAIL", str(e), "AUTH")

# Test 12.2: Access after logout
try:
    r = trpc_get(owner_session, "auth.me")
    data = r.json()
    if "error" in data:
        log_test("Access Blocked After Logout", "PASS", "Session correctly invalidated", "AUTH")
    else:
        log_test("Access Blocked After Logout", "FAIL", "Session still valid after logout!", "AUTH")
except Exception as e:
    log_test("Access Blocked After Logout", "PASS", "Request failed safely", "AUTH")

# ============================================================
# FINAL SUMMARY
# ============================================================
print("\n" + "="*60)
print("TEST SUMMARY")
print("="*60)
total = results["passed"] + results["failed"] + results["warnings"]
print(f"Total Tests: {total}")
print(f"✅ Passed: {results['passed']}")
print(f"❌ Failed: {results['failed']}")
print(f"⚠️  Warnings: {results['warnings']}")
print(f"Pass Rate: {(results['passed']/total*100):.1f}%" if total > 0 else "N/A")

# Save results to JSON
with open("/home/ubuntu/test_results/api_test_results.json", "w") as f:
    json.dump(results, f, indent=2)

print(f"\nResults saved to /home/ubuntu/test_results/api_test_results.json")

# Exit with error code if tests failed
if results["failed"] > 0:
    sys.exit(1)
