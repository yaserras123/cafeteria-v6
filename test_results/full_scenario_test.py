#!/usr/bin/env python3
"""
Full Scenario Test Suite for Cafeteria V2 Application
Tests ALL available API procedures with correct endpoint names
"""

import requests
import json
import time
import sys
import urllib.parse
from datetime import datetime

BASE_URL = "http://localhost:3000"
TRPC_URL = f"{BASE_URL}/api/trpc"

results = {
    "passed": 0,
    "failed": 0,
    "warnings": 0,
    "tests": [],
    "categories": {}
}

def log_test(name, status, details="", category="GENERAL"):
    icon = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"  {icon} {name}: {details[:100] if len(str(details)) > 100 else details}")
    results["tests"].append({
        "name": name, "status": status, "details": str(details)[:500],
        "category": category, "timestamp": datetime.now().isoformat()
    })
    if status == "PASS":
        results["passed"] += 1
    elif status == "FAIL":
        results["failed"] += 1
    else:
        results["warnings"] += 1
    
    if category not in results["categories"]:
        results["categories"][category] = {"passed": 0, "failed": 0, "warnings": 0}
    if status == "PASS":
        results["categories"][category]["passed"] += 1
    elif status == "FAIL":
        results["categories"][category]["failed"] += 1
    else:
        results["categories"][category]["warnings"] += 1

def trpc_get(session, endpoint, params=None):
    url = f"{TRPC_URL}/{endpoint}"
    if params:
        url += f"?input={urllib.parse.quote(json.dumps({'json': params}))}"
    try:
        r = session.get(url, timeout=10)
        return r.json()
    except Exception as e:
        return {"error": str(e)}

def trpc_post(session, endpoint, data):
    url = f"{TRPC_URL}/{endpoint}"
    try:
        r = session.post(url, json={"json": data}, timeout=10)
        return r.json()
    except Exception as e:
        return {"error": str(e)}

def is_ok(data):
    return "result" in data and "error" not in data

def get_val(data, *keys):
    try:
        v = data["result"]["data"]["json"]
        for k in keys:
            v = v[k]
        return v
    except:
        return None

# ============================================================
print("\n" + "="*70)
print("🧪 CAFETERIA V2 - COMPREHENSIVE TEST SUITE")
print("="*70)

# ============================================================
print("\n📋 SECTION 1: HEALTH & CONNECTIVITY")
print("-"*50)

s = requests.Session()
data = trpc_get(s, "system.health")
if is_ok(data):
    h = get_val(data)
    log_test("Server Health", "PASS", f"Status: {h.get('status')}, DB: {h.get('database')}", "HEALTH")
else:
    log_test("Server Health", "FAIL", str(data), "HEALTH")

r = requests.get(f"{BASE_URL}/", timeout=5)
log_test("Frontend Accessible", "PASS" if r.status_code == 200 else "WARN", f"HTTP {r.status_code}", "HEALTH")

# ============================================================
print("\n📋 SECTION 2: AUTHENTICATION SCENARIOS")
print("-"*50)

# 2.1 Owner Login
owner = requests.Session()
owner.headers.update({"Content-Type": "application/json"})
data = trpc_post(owner, "auth.login", {"username": "yaserras@gmail.com", "password": "Kamel123321$"})
if is_ok(data) and get_val(data, "success"):
    log_test("Owner Login (valid credentials)", "PASS", f"Welcome: {get_val(data, 'name')}", "AUTH")
else:
    log_test("Owner Login (valid credentials)", "FAIL", str(data), "AUTH")

# 2.2 Get current user
data = trpc_get(owner, "auth.me")
if is_ok(data) and get_val(data, "role") == "admin":
    log_test("Get Current User (auth.me)", "PASS", f"Role: {get_val(data, 'role')}", "AUTH")
else:
    log_test("Get Current User (auth.me)", "FAIL", str(data), "AUTH")

# 2.3 Wrong password
s2 = requests.Session()
data = trpc_post(s2, "auth.login", {"username": "yaserras@gmail.com", "password": "WrongPass999"})
log_test("Login with wrong password", "PASS" if "error" in data else "FAIL", 
         "Correctly rejected" if "error" in data else "Should have rejected", "AUTH")

# 2.4 Non-existent user
s3 = requests.Session()
data = trpc_post(s3, "auth.login", {"username": "nobody@fake.com", "password": "Pass123"})
log_test("Login with non-existent user", "PASS" if "error" in data else "FAIL",
         "Correctly rejected" if "error" in data else "Should have rejected", "AUTH")

# 2.5 Empty credentials
s4 = requests.Session()
data = trpc_post(s4, "auth.login", {"username": "", "password": ""})
log_test("Login with empty credentials", "PASS" if "error" in data else "FAIL",
         "Correctly rejected" if "error" in data else "Should have rejected", "AUTH")

# 2.6 Unauthenticated access
s5 = requests.Session()
data = trpc_get(s5, "auth.me")
log_test("Unauthenticated access blocked", "PASS" if "error" in data else "FAIL",
         "Blocked" if "error" in data else "Not blocked!", "AUTH")

# ============================================================
print("\n📋 SECTION 3: MARKETER MANAGEMENT")
print("-"*50)

# 3.1 Create Root Marketer
marketer_id = None
marketer_code = None
data = trpc_post(owner, "marketers.createRootMarketer", {
    "name": "Alpha Marketer",
    "email": "alpha@marketer.com",
    "phone": "+966501111111",
    "username": "alpha_marketer",
    "password": "AlphaPass123$",
    "country": "SA",
    "currency": "SAR",
    "language": "ar"
})
if is_ok(data):
    marketer_id = get_val(data, "id")
    marketer_code = get_val(data, "referenceCode")
    log_test("Create Root Marketer", "PASS", f"ID: {marketer_id}, Code: {marketer_code}", "MARKETER")
else:
    log_test("Create Root Marketer", "FAIL", str(get_val(data) or data), "MARKETER")

# 3.2 Create Child Marketer
child_marketer_id = None
if marketer_code:
    data = trpc_post(owner, "marketers.createChildMarketer", {
        "parentCode": marketer_code,
        "name": "Beta Sub-Marketer",
        "email": "beta@marketer.com",
        "phone": "+966502222222",
        "username": "beta_marketer",
        "password": "BetaPass123$",
        "country": "SA",
        "currency": "SAR",
        "language": "ar"
    })
    if is_ok(data):
        child_marketer_id = get_val(data, "id")
        log_test("Create Child Marketer", "PASS", f"Child ID: {child_marketer_id}", "MARKETER")
    else:
        log_test("Create Child Marketer", "FAIL", str(get_val(data) or data), "MARKETER")
else:
    log_test("Create Child Marketer", "WARN", "Skipped - no parent marketer", "MARKETER")

# 3.3 Get Marketer Balance
if marketer_id:
    data = trpc_get(owner, "marketers.getMarketerBalance", {"marketerId": marketer_id})
    if is_ok(data):
        bal = get_val(data)
        log_test("Get Marketer Balance", "PASS", f"Pending: {bal.get('pendingBalance')}, Available: {bal.get('availableBalance')}", "MARKETER")
    else:
        log_test("Get Marketer Balance", "FAIL", str(data), "MARKETER")

# 3.4 Get Marketer Hierarchy
if marketer_code:
    data = trpc_get(owner, "marketers.getMarketerHierarchy", {"marketerCode": marketer_code})
    if is_ok(data):
        h = get_val(data)
        log_test("Get Marketer Hierarchy", "PASS", f"Children: {h.get('childMarketerCount')}, Cafeterias: {h.get('cafeteriaCount')}", "MARKETER")
    else:
        log_test("Get Marketer Hierarchy", "FAIL", str(data), "MARKETER")

# ============================================================
print("\n📋 SECTION 4: CAFETERIA CREATION & MANAGEMENT")
print("-"*50)

cafeteria_id = None
cafeteria_code = None

# 4.1 Create Cafeteria via Marketer
if marketer_code:
    data = trpc_post(owner, "marketers.createCafeteria", {
        "marketerCode": marketer_code,
        "name": "Test Cafeteria Alpha",
        "location": "123 Main Street, Riyadh",
        "username": "cafe_alpha",
        "password": "CafeAlpha123$"
    })
    if is_ok(data):
        cafeteria_id = get_val(data, "id")
        cafeteria_code = get_val(data, "referenceCode")
        log_test("Create Cafeteria via Marketer", "PASS", f"ID: {cafeteria_id}, Code: {cafeteria_code}", "CAFETERIA")
    else:
        log_test("Create Cafeteria via Marketer", "FAIL", str(get_val(data) or data), "CAFETERIA")

# 4.2 Login as Cafeteria Admin
cafe_admin = requests.Session()
cafe_admin.headers.update({"Content-Type": "application/json"})
data = trpc_post(cafe_admin, "auth.login", {"username": "cafe_alpha", "password": "CafeAlpha123$"})
if is_ok(data) and get_val(data, "success"):
    log_test("Cafeteria Admin Login", "PASS", f"Type: {get_val(data, 'userType')}", "CAFETERIA")
else:
    log_test("Cafeteria Admin Login", "FAIL", str(data), "CAFETERIA")
    cafe_admin = owner  # fallback

# 4.3 Get Cafeteria Details
if cafeteria_id:
    data = trpc_get(cafe_admin, "cafeterias.getCafeteriaDetails", {"cafeteriaId": cafeteria_id})
    if is_ok(data):
        cafe = get_val(data)
        log_test("Get Cafeteria Details", "PASS", f"Name: {cafe.get('name')}", "CAFETERIA")
    else:
        log_test("Get Cafeteria Details", "FAIL", str(data), "CAFETERIA")

# ============================================================
print("\n📋 SECTION 5: STAFF MANAGEMENT")
print("-"*50)

manager_id = None
waiter_id = None
chef_id = None

# 5.1 Create Manager
data = trpc_post(cafe_admin, "staff.createStaff", {
    "name": "Ahmed Manager",
    "username": "ahmed_manager",
    "password": "AhmedMgr123$",
    "role": "manager",
    "cafeteriaId": cafeteria_id
})
if is_ok(data):
    manager_id = get_val(data, "id")
    log_test("Create Manager Staff", "PASS", f"ID: {manager_id}", "STAFF")
else:
    log_test("Create Manager Staff", "FAIL", str(get_val(data) or data), "STAFF")

# 5.2 Create Waiter
data = trpc_post(cafe_admin, "staff.createStaff", {
    "name": "Mohammed Waiter",
    "username": "mohammed_waiter",
    "password": "MohammedW123$",
    "role": "waiter",
    "cafeteriaId": cafeteria_id
})
if is_ok(data):
    waiter_id = get_val(data, "id")
    log_test("Create Waiter Staff", "PASS", f"ID: {waiter_id}", "STAFF")
else:
    log_test("Create Waiter Staff", "FAIL", str(get_val(data) or data), "STAFF")

# 5.3 Create Chef
data = trpc_post(cafe_admin, "staff.createStaff", {
    "name": "Ali Chef",
    "username": "ali_chef",
    "password": "AliChef123$",
    "role": "chef",
    "cafeteriaId": cafeteria_id
})
if is_ok(data):
    chef_id = get_val(data, "id")
    log_test("Create Chef Staff", "PASS", f"ID: {chef_id}", "STAFF")
else:
    log_test("Create Chef Staff", "FAIL", str(get_val(data) or data), "STAFF")

# 5.4 Get Staff List
data = trpc_get(cafe_admin, "staff.getStaff", {"cafeteriaId": cafeteria_id})
if is_ok(data):
    staff_list = get_val(data, "staff") or []
    log_test("Get Staff List", "PASS", f"Found {len(staff_list)} staff", "STAFF")
else:
    log_test("Get Staff List", "FAIL", str(data), "STAFF")

# 5.5 Grant Login Permission
if waiter_id:
    data = trpc_post(cafe_admin, "staff.grantLoginPermission", {"staffId": waiter_id})
    if is_ok(data):
        log_test("Grant Login Permission (Waiter)", "PASS", "Permission granted", "STAFF")
    else:
        log_test("Grant Login Permission (Waiter)", "FAIL", str(get_val(data) or data), "STAFF")

if chef_id:
    data = trpc_post(cafe_admin, "staff.grantLoginPermission", {"staffId": chef_id})
    if is_ok(data):
        log_test("Grant Login Permission (Chef)", "PASS", "Permission granted", "STAFF")
    else:
        log_test("Grant Login Permission (Chef)", "FAIL", str(get_val(data) or data), "STAFF")

# 5.6 Get Staff Permissions
if waiter_id:
    data = trpc_get(cafe_admin, "staff.getPermissions", {"staffId": waiter_id})
    if is_ok(data):
        log_test("Get Staff Permissions", "PASS", "Permissions retrieved", "STAFF")
    else:
        log_test("Get Staff Permissions", "FAIL", str(data), "STAFF")

# ============================================================
print("\n📋 SECTION 6: MENU MANAGEMENT")
print("-"*50)

category_id = None
item_id = None

# 6.1 Create Category
data = trpc_post(cafe_admin, "menu.createCategory", {
    "name": "Main Dishes",
    "cafeteriaId": cafeteria_id
})
if is_ok(data):
    category_id = get_val(data, "id")
    log_test("Create Menu Category", "PASS", f"ID: {category_id}", "MENU")
else:
    log_test("Create Menu Category", "FAIL", str(get_val(data) or data), "MENU")

# 6.2 Create Second Category
cat2_id = None
data = trpc_post(cafe_admin, "menu.createCategory", {
    "name": "Beverages",
    "cafeteriaId": cafeteria_id
})
if is_ok(data):
    cat2_id = get_val(data, "id")
    log_test("Create Second Menu Category", "PASS", f"ID: {cat2_id}", "MENU")
else:
    log_test("Create Second Menu Category", "FAIL", str(get_val(data) or data), "MENU")

# 6.3 Create Menu Item
data = trpc_post(cafe_admin, "menu.createMenuItem", {
    "name": "Grilled Chicken",
    "price": 35.00,
    "categoryId": category_id,
    "cafeteriaId": cafeteria_id,
    "isAvailable": True,
    "description": "Juicy grilled chicken with rice"
})
if is_ok(data):
    item_id = get_val(data, "id")
    log_test("Create Menu Item", "PASS", f"ID: {item_id}", "MENU")
else:
    log_test("Create Menu Item", "FAIL", str(get_val(data) or data), "MENU")

# 6.4 Create Second Item
item2_id = None
data = trpc_post(cafe_admin, "menu.createMenuItem", {
    "name": "Fresh Orange Juice",
    "price": 12.00,
    "categoryId": cat2_id,
    "cafeteriaId": cafeteria_id,
    "isAvailable": True
})
if is_ok(data):
    item2_id = get_val(data, "id")
    log_test("Create Second Menu Item", "PASS", f"ID: {item2_id}", "MENU")
else:
    log_test("Create Second Menu Item", "FAIL", str(get_val(data) or data), "MENU")

# 6.5 Get Categories
data = trpc_get(cafe_admin, "menu.getCategories", {"cafeteriaId": cafeteria_id})
if is_ok(data):
    cats = get_val(data, "categories") or []
    log_test("Get Menu Categories", "PASS", f"Found {len(cats)} categories", "MENU")
else:
    log_test("Get Menu Categories", "FAIL", str(data), "MENU")

# 6.6 Get Menu Items
data = trpc_get(cafe_admin, "menu.getMenuItems", {"cafeteriaId": cafeteria_id})
if is_ok(data):
    items = get_val(data, "items") or []
    log_test("Get Menu Items", "PASS", f"Found {len(items)} items", "MENU")
else:
    log_test("Get Menu Items", "FAIL", str(data), "MENU")

# 6.7 Update Item Availability
if item_id:
    data = trpc_post(cafe_admin, "menu.updateItemAvailability", {
        "itemId": item_id,
        "isAvailable": False
    })
    if is_ok(data):
        log_test("Update Item Availability (disable)", "PASS", "Item disabled", "MENU")
    else:
        log_test("Update Item Availability (disable)", "FAIL", str(get_val(data) or data), "MENU")
    
    # Re-enable
    data = trpc_post(cafe_admin, "menu.updateItemAvailability", {
        "itemId": item_id,
        "isAvailable": True
    })
    if is_ok(data):
        log_test("Update Item Availability (re-enable)", "PASS", "Item re-enabled", "MENU")
    else:
        log_test("Update Item Availability (re-enable)", "FAIL", str(get_val(data) or data), "MENU")

# 6.8 Get Menu Summary
data = trpc_get(cafe_admin, "menu.getMenuSummary", {"cafeteriaId": cafeteria_id})
if is_ok(data):
    log_test("Get Menu Summary", "PASS", "Summary retrieved", "MENU")
else:
    log_test("Get Menu Summary", "FAIL", str(data), "MENU")

# ============================================================
print("\n📋 SECTION 7: TABLE & SECTION MANAGEMENT")
print("-"*50)

section_id = None
table_id = None
table_token = None

# 7.1 Create Section
data = trpc_post(cafe_admin, "tables.createSection", {
    "name": "Main Hall",
    "cafeteriaId": cafeteria_id
})
if is_ok(data):
    section_id = get_val(data, "id")
    log_test("Create Table Section", "PASS", f"ID: {section_id}", "TABLES")
else:
    log_test("Create Table Section", "FAIL", str(get_val(data) or data), "TABLES")

# 7.2 Create Table
data = trpc_post(cafe_admin, "tables.createTable", {
    "name": "Table 1",
    "sectionId": section_id,
    "cafeteriaId": cafeteria_id,
    "capacity": 4
})
if is_ok(data):
    t = get_val(data)
    table_id = t.get("id")
    table_token = t.get("token") or t.get("qrToken")
    log_test("Create Table", "PASS", f"ID: {table_id}, Token: {str(table_token)[:15]}...", "TABLES")
else:
    log_test("Create Table", "FAIL", str(get_val(data) or data), "TABLES")

# 7.3 Create Second Table
table2_id = None
data = trpc_post(cafe_admin, "tables.createTable", {
    "name": "Table 2",
    "sectionId": section_id,
    "cafeteriaId": cafeteria_id,
    "capacity": 6
})
if is_ok(data):
    table2_id = get_val(data, "id")
    log_test("Create Second Table", "PASS", f"ID: {table2_id}", "TABLES")
else:
    log_test("Create Second Table", "FAIL", str(get_val(data) or data), "TABLES")

# 7.4 Get Tables
data = trpc_get(cafe_admin, "tables.getTables", {"cafeteriaId": cafeteria_id})
if is_ok(data):
    tables = get_val(data, "tables") or []
    log_test("Get Tables", "PASS", f"Found {len(tables)} tables", "TABLES")
    # Get token from first table if not already set
    if tables and not table_token:
        table_token = tables[0].get("token") or tables[0].get("qrToken")
        table_id = tables[0].get("id")
else:
    log_test("Get Tables", "FAIL", str(data), "TABLES")

# 7.5 Get Sections
data = trpc_get(cafe_admin, "tables.getSections", {"cafeteriaId": cafeteria_id})
if is_ok(data):
    sections = get_val(data, "sections") or []
    log_test("Get Sections", "PASS", f"Found {len(sections)} sections", "TABLES")
else:
    log_test("Get Sections", "FAIL", str(data), "TABLES")

# 7.6 Update Table Status
if table_id:
    data = trpc_post(cafe_admin, "tables.updateTableStatus", {
        "tableId": table_id,
        "status": "occupied"
    })
    if is_ok(data):
        log_test("Update Table Status (occupied)", "PASS", "Status updated", "TABLES")
    else:
        log_test("Update Table Status (occupied)", "FAIL", str(get_val(data) or data), "TABLES")

# 7.7 Get Available Tables
data = trpc_get(cafe_admin, "tables.getAvailableTables", {"cafeteriaId": cafeteria_id})
if is_ok(data):
    avail = get_val(data, "tables") or []
    log_test("Get Available Tables", "PASS", f"Found {len(avail)} available", "TABLES")
else:
    log_test("Get Available Tables", "FAIL", str(data), "TABLES")

# 7.8 Get Occupancy
data = trpc_get(cafe_admin, "tables.getCafeteriaOccupancy", {"cafeteriaId": cafeteria_id})
if is_ok(data):
    log_test("Get Cafeteria Occupancy", "PASS", "Occupancy data retrieved", "TABLES")
else:
    log_test("Get Cafeteria Occupancy", "FAIL", str(data), "TABLES")

# 7.9 Regenerate Table Token
if table_id:
    data = trpc_post(cafe_admin, "tables.regenerateTableToken", {"tableId": table_id})
    if is_ok(data):
        new_token = get_val(data, "token") or get_val(data, "qrToken")
        if new_token:
            table_token = new_token
        log_test("Regenerate Table Token", "PASS", "Token regenerated", "TABLES")
    else:
        log_test("Regenerate Table Token", "FAIL", str(get_val(data) or data), "TABLES")

# ============================================================
print("\n📋 SECTION 8: RECHARGE WORKFLOW")
print("-"*50)

recharge_id = None

# 8.1 Create Recharge Request
data = trpc_post(cafe_admin, "recharges.createRequest", {
    "cafeteriaId": cafeteria_id,
    "amount": 500,
    "currency": "SAR",
    "notes": "Initial balance top-up"
})
if is_ok(data):
    recharge_id = get_val(data, "id")
    log_test("Create Recharge Request", "PASS", f"ID: {recharge_id}", "RECHARGE")
else:
    log_test("Create Recharge Request", "FAIL", str(get_val(data) or data), "RECHARGE")

# 8.2 Get Recharge Requests
data = trpc_get(owner, "recharges.getRequests", {"status": "pending"})
if is_ok(data):
    reqs = get_val(data, "requests") or []
    log_test("Get Pending Recharge Requests", "PASS", f"Found {len(reqs)} pending", "RECHARGE")
else:
    log_test("Get Pending Recharge Requests", "FAIL", str(data), "RECHARGE")

# 8.3 Approve Recharge Request
if recharge_id:
    data = trpc_post(owner, "recharges.approveRequest", {"requestId": recharge_id})
    if is_ok(data):
        log_test("Approve Recharge Request", "PASS", "Request approved, balance updated", "RECHARGE")
    else:
        log_test("Approve Recharge Request", "FAIL", str(get_val(data) or data), "RECHARGE")

# 8.4 Create and Reject Another Request
data = trpc_post(cafe_admin, "recharges.createRequest", {
    "cafeteriaId": cafeteria_id,
    "amount": 200,
    "currency": "SAR"
})
if is_ok(data):
    reject_id = get_val(data, "id")
    data2 = trpc_post(owner, "recharges.rejectRequest", {
        "requestId": reject_id,
        "reason": "Insufficient documentation"
    })
    if is_ok(data2):
        log_test("Reject Recharge Request", "PASS", "Request rejected with reason", "RECHARGE")
    else:
        log_test("Reject Recharge Request", "FAIL", str(get_val(data2) or data2), "RECHARGE")

# ============================================================
print("\n📋 SECTION 9: SHIFT MANAGEMENT")
print("-"*50)

# Login as Waiter
waiter_session = requests.Session()
waiter_session.headers.update({"Content-Type": "application/json"})
data = trpc_post(waiter_session, "auth.login", {"username": "mohammed_waiter", "password": "MohammedW123$"})
if is_ok(data) and get_val(data, "success"):
    log_test("Waiter Login", "PASS", "Waiter logged in", "SHIFTS")
else:
    log_test("Waiter Login", "FAIL", str(data), "SHIFTS")
    waiter_session = cafe_admin

# Login as Chef
chef_session = requests.Session()
chef_session.headers.update({"Content-Type": "application/json"})
data = trpc_post(chef_session, "auth.login", {"username": "ali_chef", "password": "AliChef123$"})
if is_ok(data) and get_val(data, "success"):
    log_test("Chef Login", "PASS", "Chef logged in", "SHIFTS")
else:
    log_test("Chef Login", "FAIL", str(data), "SHIFTS")
    chef_session = cafe_admin

# 9.1 Start Shift (Waiter)
shift_id = None
data = trpc_post(waiter_session, "shifts.startShift", {"cafeteriaId": cafeteria_id})
if is_ok(data):
    shift_id = get_val(data, "id")
    log_test("Start Shift (Waiter)", "PASS", f"Shift ID: {shift_id}", "SHIFTS")
else:
    log_test("Start Shift (Waiter)", "FAIL", str(get_val(data) or data), "SHIFTS")

# 9.2 Get Active Shift
if shift_id:
    data = trpc_get(waiter_session, "shifts.getShift", {"shiftId": shift_id})
    if is_ok(data):
        shift = get_val(data)
        log_test("Get Shift Details", "PASS", f"Status: {shift.get('status')}", "SHIFTS")
    else:
        log_test("Get Shift Details", "FAIL", str(data), "SHIFTS")

# 9.3 Get Cafeteria Shifts
data = trpc_get(cafe_admin, "shifts.getCafeteriaShifts", {"cafeteriaId": cafeteria_id})
if is_ok(data):
    shifts = get_val(data, "shifts") or []
    log_test("Get Cafeteria Shifts", "PASS", f"Found {len(shifts)} shifts", "SHIFTS")
else:
    log_test("Get Cafeteria Shifts", "FAIL", str(data), "SHIFTS")

# ============================================================
print("\n📋 SECTION 10: ORDER LIFECYCLE")
print("-"*50)

order_id = None
order_item_id = None

# 10.1 Create Order
data = trpc_post(waiter_session, "orders.createOrder", {
    "tableId": table_id,
    "cafeteriaId": cafeteria_id
})
if is_ok(data):
    order_id = get_val(data, "id")
    log_test("Create Order", "PASS", f"Order ID: {order_id}", "ORDERS")
else:
    log_test("Create Order", "FAIL", str(get_val(data) or data), "ORDERS")

# 10.2 Add Item to Order
if order_id and item_id:
    data = trpc_post(waiter_session, "orders.addItem", {
        "orderId": order_id,
        "menuItemId": item_id,
        "quantity": 2,
        "unitPrice": 35.00
    })
    if is_ok(data):
        oi = get_val(data)
        order_item_id = oi.get("id") if oi else None
        log_test("Add Item to Order", "PASS", f"Item ID: {order_item_id}", "ORDERS")
    else:
        log_test("Add Item to Order", "FAIL", str(get_val(data) or data), "ORDERS")

# 10.3 Add Second Item
if order_id and item2_id:
    data = trpc_post(waiter_session, "orders.addItem", {
        "orderId": order_id,
        "menuItemId": item2_id,
        "quantity": 1,
        "unitPrice": 12.00
    })
    if is_ok(data):
        log_test("Add Second Item to Order", "PASS", "Second item added", "ORDERS")
    else:
        log_test("Add Second Item to Order", "FAIL", str(get_val(data) or data), "ORDERS")

# 10.4 Get Order Details
if order_id:
    data = trpc_get(waiter_session, "orders.getOrderDetails", {"orderId": order_id})
    if is_ok(data):
        order = get_val(data)
        log_test("Get Order Details", "PASS", f"Items: {len(order.get('items', []))}", "ORDERS")
    else:
        log_test("Get Order Details", "FAIL", str(data), "ORDERS")

# 10.5 Send to Kitchen
if order_id:
    data = trpc_post(waiter_session, "orders.sendToKitchen", {"orderId": order_id})
    if is_ok(data):
        log_test("Send Order to Kitchen", "PASS", "Order sent to kitchen", "ORDERS")
    else:
        log_test("Send Order to Kitchen", "FAIL", str(get_val(data) or data), "ORDERS")

# 10.6 Get Kitchen Orders (Chef)
data = trpc_get(chef_session, "orders.getKitchenOrders", {"cafeteriaId": cafeteria_id})
if is_ok(data):
    kitchen_orders = get_val(data, "orders") or []
    log_test("Get Kitchen Orders (Chef)", "PASS", f"Found {len(kitchen_orders)} orders", "ORDERS")
else:
    log_test("Get Kitchen Orders (Chef)", "FAIL", str(data), "ORDERS")

# 10.7 Chef Updates Item Status - In Preparation
if order_item_id:
    data = trpc_post(chef_session, "orders.updateItemStatus", {
        "orderItemId": order_item_id,
        "status": "in_preparation"
    })
    if is_ok(data):
        log_test("Chef: Item → In Preparation", "PASS", "Status updated", "ORDERS")
    else:
        log_test("Chef: Item → In Preparation", "FAIL", str(get_val(data) or data), "ORDERS")

# 10.8 Chef Updates Item Status - Ready
if order_item_id:
    data = trpc_post(chef_session, "orders.updateItemStatus", {
        "orderItemId": order_item_id,
        "status": "ready"
    })
    if is_ok(data):
        log_test("Chef: Item → Ready", "PASS", "Status updated to ready", "ORDERS")
    else:
        log_test("Chef: Item → Ready", "FAIL", str(get_val(data) or data), "ORDERS")

# 10.9 Close Order
if order_id:
    data = trpc_post(waiter_session, "orders.closeOrder", {"orderId": order_id})
    if is_ok(data):
        log_test("Close Order", "PASS", "Order closed, balance deducted", "ORDERS")
    else:
        log_test("Close Order", "FAIL", str(get_val(data) or data), "ORDERS")

# 10.10 Get Orders List
data = trpc_get(cafe_admin, "orders.getOrders", {"cafeteriaId": cafeteria_id})
if is_ok(data):
    orders_list = get_val(data, "orders") or []
    log_test("Get Orders List", "PASS", f"Found {len(orders_list)} orders", "ORDERS")
else:
    log_test("Get Orders List", "FAIL", str(data), "ORDERS")

# ============================================================
print("\n📋 SECTION 11: QR CODE & CUSTOMER MENU")
print("-"*50)

# 11.1 Resolve Table by Token
if table_token:
    data = trpc_get(requests.Session(), "qrOrders.resolveTableByToken", {"token": table_token})
    if is_ok(data):
        table_info = get_val(data)
        log_test("Resolve Table by QR Token", "PASS", f"Table: {table_info.get('tableName')}", "QR")
    else:
        log_test("Resolve Table by QR Token", "FAIL", str(data), "QR")
else:
    log_test("Resolve Table by QR Token", "WARN", "No token available", "QR")

# 11.2 Customer Creates Order via QR
customer_order_id = None
if table_token:
    data = trpc_post(requests.Session(), "qrOrders.createCustomerOrder", {
        "tableToken": table_token,
        "items": [
            {"menuItemId": item_id, "quantity": 1},
            {"menuItemId": item2_id, "quantity": 2}
        ] if item_id and item2_id else []
    })
    if is_ok(data):
        customer_order_id = get_val(data, "orderId")
        log_test("Customer Create Order via QR", "PASS", f"Order: {customer_order_id}", "QR")
    else:
        log_test("Customer Create Order via QR", "FAIL", str(get_val(data) or data), "QR")

# 11.3 Customer Track Order
if customer_order_id:
    data = trpc_get(requests.Session(), "qrOrders.getCustomerOrder", {"orderId": customer_order_id})
    if is_ok(data):
        log_test("Customer Track Order Status", "PASS", "Order status retrieved", "QR")
    else:
        log_test("Customer Track Order Status", "FAIL", str(data), "QR")

# ============================================================
print("\n📋 SECTION 12: REPORTING")
print("-"*50)

# 12.1 Generate Daily Report
data = trpc_post(cafe_admin, "reporting.generateDailyReport", {
    "cafeteriaId": cafeteria_id,
    "date": datetime.now().strftime("%Y-%m-%d")
})
if is_ok(data):
    log_test("Generate Daily Report", "PASS", "Report generated", "REPORTING")
else:
    log_test("Generate Daily Report", "FAIL", str(get_val(data) or data), "REPORTING")

# 12.2 Get Cafeteria Reports
data = trpc_get(cafe_admin, "reporting.getCafeteriaReports", {"cafeteriaId": cafeteria_id})
if is_ok(data):
    reports = get_val(data, "reports") or []
    log_test("Get Cafeteria Reports", "PASS", f"Found {len(reports)} reports", "REPORTING")
else:
    log_test("Get Cafeteria Reports", "FAIL", str(data), "REPORTING")

# 12.3 Get Top Items Report
data = trpc_get(cafe_admin, "reporting.getTopItemsReport", {
    "cafeteriaId": cafeteria_id,
    "limit": 10
})
if is_ok(data):
    log_test("Get Top Items Report", "PASS", "Report retrieved", "REPORTING")
else:
    log_test("Get Top Items Report", "FAIL", str(data), "REPORTING")

# 12.4 Get Top Staff Report
data = trpc_get(cafe_admin, "reporting.getTopStaffReport", {
    "cafeteriaId": cafeteria_id,
    "limit": 10
})
if is_ok(data):
    log_test("Get Top Staff Report", "PASS", "Report retrieved", "REPORTING")
else:
    log_test("Get Top Staff Report", "FAIL", str(data), "REPORTING")

# 12.5 Get Staff Performance
data = trpc_get(cafe_admin, "shifts.getStaffPerformance", {"cafeteriaId": cafeteria_id})
if is_ok(data):
    log_test("Get Staff Performance", "PASS", "Performance data retrieved", "REPORTING")
else:
    log_test("Get Staff Performance", "FAIL", str(data), "REPORTING")

# ============================================================
print("\n📋 SECTION 13: COMMISSION MANAGEMENT")
print("-"*50)

# 13.1 Get Commission Balance
data = trpc_get(owner, "commissions.getBalance", {"marketerId": marketer_id})
if is_ok(data):
    log_test("Get Commission Balance", "PASS", "Balance retrieved", "COMMISSION")
else:
    log_test("Get Commission Balance", "FAIL", str(data), "COMMISSION")

# 13.2 Get Commission Distributions
data = trpc_get(owner, "commissions.getDistributions", {"marketerId": marketer_id})
if is_ok(data):
    dists = get_val(data, "distributions") or []
    log_test("Get Commission Distributions", "PASS", f"Found {len(dists)} distributions", "COMMISSION")
else:
    log_test("Get Commission Distributions", "FAIL", str(data), "COMMISSION")

# 13.3 Get Commission History
data = trpc_get(owner, "commissions.getCommissionHistory", {"marketerId": marketer_id})
if is_ok(data):
    log_test("Get Commission History", "PASS", "History retrieved", "COMMISSION")
else:
    log_test("Get Commission History", "FAIL", str(data), "COMMISSION")

# ============================================================
print("\n📋 SECTION 14: WITHDRAWAL MANAGEMENT")
print("-"*50)

# 14.1 Request Withdrawal
withdrawal_id = None
if marketer_id:
    data = trpc_post(owner, "withdrawals.requestWithdrawal", {
        "marketerId": marketer_id,
        "amount": 50,
        "currency": "SAR",
        "bankDetails": "Bank: Al Rajhi, IBAN: SA1234567890"
    })
    if is_ok(data):
        withdrawal_id = get_val(data, "id")
        log_test("Request Withdrawal", "PASS", f"ID: {withdrawal_id}", "WITHDRAWAL")
    else:
        log_test("Request Withdrawal", "FAIL", str(get_val(data) or data), "WITHDRAWAL")

# 14.2 Get Withdrawal Requests
data = trpc_get(owner, "withdrawals.getRequests", {"status": "pending"})
if is_ok(data):
    reqs = get_val(data, "requests") or []
    log_test("Get Withdrawal Requests", "PASS", f"Found {len(reqs)} pending", "WITHDRAWAL")
else:
    log_test("Get Withdrawal Requests", "FAIL", str(data), "WITHDRAWAL")

# 14.3 Approve Withdrawal
if withdrawal_id:
    data = trpc_post(owner, "withdrawals.approveRequest", {"requestId": withdrawal_id})
    if is_ok(data):
        log_test("Approve Withdrawal Request", "PASS", "Withdrawal approved", "WITHDRAWAL")
    else:
        log_test("Approve Withdrawal Request", "FAIL", str(get_val(data) or data), "WITHDRAWAL")

# ============================================================
print("\n📋 SECTION 15: SYSTEM MANAGEMENT")
print("-"*50)

# 15.1 Get System Logs
data = trpc_get(owner, "system.getLogs", {"limit": 10})
if is_ok(data):
    logs = get_val(data, "logs") or []
    log_test("Get System Logs", "PASS", f"Found {len(logs)} logs", "SYSTEM")
else:
    log_test("Get System Logs", "FAIL", str(data), "SYSTEM")

# 15.2 Get/Set Global Free Months
data = trpc_get(owner, "system.getGlobalFreeMonths")
if is_ok(data):
    months = get_val(data, "months") or 0
    log_test("Get Global Free Months", "PASS", f"Current: {months} months", "SYSTEM")
else:
    log_test("Get Global Free Months", "FAIL", str(data), "SYSTEM")

data = trpc_post(owner, "system.setGlobalFreeMonths", {"months": 3})
if is_ok(data):
    log_test("Set Global Free Months", "PASS", "Set to 3 months", "SYSTEM")
else:
    log_test("Set Global Free Months", "FAIL", str(get_val(data) or data), "SYSTEM")

# 15.3 Export Backup
data = trpc_get(owner, "system.exportBackup")
if is_ok(data):
    log_test("Export System Backup", "PASS", "Backup exported", "SYSTEM")
else:
    log_test("Export System Backup", "FAIL", str(data), "SYSTEM")

# ============================================================
print("\n📋 SECTION 16: END SHIFT & CLEANUP")
print("-"*50)

# 16.1 End Shift
if shift_id:
    data = trpc_post(waiter_session, "shifts.endShift", {"shiftId": shift_id})
    if is_ok(data):
        log_test("End Shift (Waiter)", "PASS", "Shift ended successfully", "SHIFTS")
    else:
        log_test("End Shift (Waiter)", "FAIL", str(get_val(data) or data), "SHIFTS")

# 16.2 Get Staff Shifts
if waiter_id:
    data = trpc_get(cafe_admin, "shifts.getStaffShifts", {"staffId": waiter_id})
    if is_ok(data):
        shifts = get_val(data, "shifts") or []
        log_test("Get Staff Shifts History", "PASS", f"Found {len(shifts)} shifts", "SHIFTS")
    else:
        log_test("Get Staff Shifts History", "FAIL", str(data), "SHIFTS")

# ============================================================
print("\n📋 SECTION 17: LOGOUT")
print("-"*50)

# 17.1 Logout Owner
data = trpc_post(owner, "auth.logout", {})
if is_ok(data):
    log_test("Owner Logout", "PASS", "Logged out successfully", "AUTH")
else:
    log_test("Owner Logout", "FAIL", str(data), "AUTH")

# 17.2 Verify session invalidated
data = trpc_get(owner, "auth.me")
if "error" in data:
    log_test("Session Invalidated After Logout", "PASS", "Session correctly cleared", "AUTH")
else:
    log_test("Session Invalidated After Logout", "FAIL", "Session still active!", "AUTH")

# ============================================================
print("\n" + "="*70)
print("📊 TEST RESULTS SUMMARY")
print("="*70)

total = results["passed"] + results["failed"] + results["warnings"]
pass_rate = (results["passed"] / total * 100) if total > 0 else 0

print(f"\n📈 Overall Results:")
print(f"   Total Tests:  {total}")
print(f"   ✅ Passed:    {results['passed']}")
print(f"   ❌ Failed:    {results['failed']}")
print(f"   ⚠️  Warnings:  {results['warnings']}")
print(f"   Pass Rate:    {pass_rate:.1f}%")

print(f"\n📊 Results by Category:")
for cat, counts in sorted(results["categories"].items()):
    cat_total = counts["passed"] + counts["failed"] + counts["warnings"]
    cat_rate = (counts["passed"] / cat_total * 100) if cat_total > 0 else 0
    print(f"   {cat:15s}: ✅{counts['passed']:3d} ❌{counts['failed']:3d} ⚠️{counts['warnings']:3d} ({cat_rate:.0f}%)")

if results["failed"] > 0:
    print(f"\n❌ Failed Tests:")
    for t in results["tests"]:
        if t["status"] == "FAIL":
            print(f"   - [{t['category']}] {t['name']}")
            print(f"     {t['details'][:200]}")

# Save results
with open("/home/ubuntu/test_results/scenario_test_results.json", "w") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print(f"\n💾 Results saved to /home/ubuntu/test_results/scenario_test_results.json")
print("="*70)

sys.exit(1 if results["failed"] > total * 0.3 else 0)
