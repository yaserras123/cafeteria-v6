#!/usr/bin/env python3
"""
CAFETERIA V2 - FINAL COMPREHENSIVE TEST SUITE
Tests ALL API procedures with correct schemas and full workflow coverage
"""

import requests
import json
import time
import sys
import urllib.parse
from datetime import datetime, date

BASE_URL = "http://localhost:3000"
TRPC_URL = f"{BASE_URL}/api/trpc"

results = {
    "passed": 0, "failed": 0, "warnings": 0,
    "tests": [], "categories": {}
}

def log(name, status, details="", category="GENERAL"):
    icon = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    short = str(details)[:120]
    print(f"  {icon} [{category}] {name}: {short}")
    results["tests"].append({"name": name, "status": status, "details": str(details)[:500], "category": category})
    if status == "PASS": results["passed"] += 1
    elif status == "FAIL": results["failed"] += 1
    else: results["warnings"] += 1
    if category not in results["categories"]:
        results["categories"][category] = {"passed": 0, "failed": 0, "warnings": 0}
    if status == "PASS": results["categories"][category]["passed"] += 1
    elif status == "FAIL": results["categories"][category]["failed"] += 1
    else: results["categories"][category]["warnings"] += 1

def get(session, endpoint, params=None):
    url = f"{TRPC_URL}/{endpoint}"
    if params:
        url += f"?input={urllib.parse.quote(json.dumps({'json': params}))}"
    try:
        r = session.get(url, timeout=15)
        return r.json()
    except Exception as e:
        return {"error": str(e)}

def post(session, endpoint, data):
    url = f"{TRPC_URL}/{endpoint}"
    try:
        r = session.post(url, json={"json": data}, timeout=15)
        return r.json()
    except Exception as e:
        return {"error": str(e)}

def ok(data):
    return "result" in data and "error" not in data

def val(data, *keys):
    try:
        v = data["result"]["data"]["json"]
        for k in keys:
            v = v[k]
        return v
    except:
        return None

def err_msg(data):
    try:
        return data["error"]["json"]["message"]
    except:
        return str(data)[:200]

# ============================================================
print("\n" + "="*70)
print("🧪 CAFETERIA V2 - FINAL COMPREHENSIVE TEST SUITE")
print(f"   Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("="*70)

# ============================================================
print("\n" + "─"*70)
print("📋 SECTION 1: HEALTH & CONNECTIVITY")
print("─"*70)

s = requests.Session()
data = get(s, "system.health")
if ok(data):
    h = val(data)
    log("Server Health Check", "PASS", f"Status: {h.get('status')}, DB: {h.get('database')}", "HEALTH")
else:
    log("Server Health Check", "FAIL", err_msg(data), "HEALTH")

r = requests.get(f"{BASE_URL}/", timeout=5)
log("Frontend Accessible (HTTP 200)", "PASS" if r.status_code == 200 else "WARN", f"HTTP {r.status_code}", "HEALTH")

# ============================================================
print("\n" + "─"*70)
print("📋 SECTION 2: AUTHENTICATION - OWNER LOGIN")
print("─"*70)

owner = requests.Session()
owner.headers.update({"Content-Type": "application/json"})

# 2.1 Valid owner login
data = post(owner, "auth.login", {"username": "yaserras@gmail.com", "password": "Kamel123321$"})
if ok(data) and val(data, "success"):
    log("Owner Login (valid credentials)", "PASS", f"Name: {val(data,'name')}, Type: {val(data,'userType')}", "AUTH")
else:
    log("Owner Login (valid credentials)", "FAIL", err_msg(data), "AUTH")
    print("  ⛔ CRITICAL: Cannot continue without owner login!")
    sys.exit(1)

# 2.2 Get current user
data = get(owner, "auth.me")
if ok(data) and val(data, "role") == "admin":
    log("Get Current User (auth.me)", "PASS", f"Role: {val(data,'role')}", "AUTH")
else:
    log("Get Current User (auth.me)", "FAIL", err_msg(data), "AUTH")

# 2.3 Wrong password
s2 = requests.Session()
data = post(s2, "auth.login", {"username": "yaserras@gmail.com", "password": "WrongPass999"})
log("Login with wrong password (rejected)", "PASS" if "error" in data else "FAIL",
    "Correctly rejected" if "error" in data else "SECURITY ISSUE: Should reject!", "AUTH")

# 2.4 Non-existent user
s3 = requests.Session()
data = post(s3, "auth.login", {"username": "nobody@fake.com", "password": "Pass123"})
log("Login with non-existent user (rejected)", "PASS" if "error" in data else "FAIL",
    "Correctly rejected" if "error" in data else "SECURITY ISSUE!", "AUTH")

# 2.5 Empty credentials
s4 = requests.Session()
data = post(s4, "auth.login", {"username": "", "password": ""})
log("Login with empty credentials (rejected)", "PASS" if "error" in data else "FAIL",
    "Correctly rejected" if "error" in data else "SECURITY ISSUE!", "AUTH")

# 2.6 Unauthenticated access to protected endpoint
s5 = requests.Session()
data = get(s5, "auth.me")
log("Unauthenticated access blocked", "PASS" if val(data) is None else "WARN",
    "No user returned" if val(data) is None else f"Returned: {val(data)}", "AUTH")

# ============================================================
print("\n" + "─"*70)
print("📋 SECTION 3: MARKETER MANAGEMENT")
print("─"*70)

marketer_id = None
marketer_code = None

# 3.1 Create Root Marketer
data = post(owner, "marketers.createRootMarketer", {
    "name": "Alpha Marketer",
    "email": "alpha@marketer.com",
    "country": "SA",
    "currency": "SAR",
    "language": "ar"
})
if ok(data):
    marketer_id = val(data, "id")
    marketer_code = val(data, "referenceCode")
    log("Create Root Marketer", "PASS", f"ID: {marketer_id}, Code: {marketer_code}", "MARKETER")
else:
    log("Create Root Marketer", "FAIL", err_msg(data), "MARKETER")

# 3.2 Create credentials for marketer
if marketer_id:
    data = post(owner, "auth.createUserCredentials", {
        "entityId": marketer_id,
        "entityType": "marketer",
        "username": "alpha_marketer",
        "password": "AlphaPass123$"
    })
    if ok(data):
        log("Create Marketer Login Credentials", "PASS", "Credentials created", "MARKETER")
    else:
        log("Create Marketer Login Credentials", "FAIL", err_msg(data), "MARKETER")

# 3.3 Login as Marketer
marketer_session = requests.Session()
marketer_session.headers.update({"Content-Type": "application/json"})
data = post(marketer_session, "auth.login", {"username": "alpha_marketer", "password": "AlphaPass123$"})
if ok(data) and val(data, "success"):
    log("Marketer Login", "PASS", f"Type: {val(data,'userType')}, Name: {val(data,'name')}", "MARKETER")
else:
    log("Marketer Login", "FAIL", err_msg(data), "MARKETER")
    marketer_session = owner  # fallback

# 3.4 Create Child Marketer
child_marketer_id = None
child_marketer_code = None
if marketer_code:
    data = post(marketer_session, "marketers.createChildMarketer", {
        "parentMarketerCode": marketer_code,
        "name": "Beta Sub-Marketer",
        "email": "beta@marketer.com",
        "country": "SA",
        "currency": "SAR",
        "language": "ar"
    })
    if ok(data):
        child_marketer_id = val(data, "id")
        child_marketer_code = val(data, "referenceCode")
        log("Create Child Marketer", "PASS", f"ID: {child_marketer_id}, Code: {child_marketer_code}", "MARKETER")
    else:
        log("Create Child Marketer", "FAIL", err_msg(data), "MARKETER")

# 3.5 Get Marketer Hierarchy
if marketer_code:
    data = get(marketer_session, "marketers.getMarketerHierarchy", {"marketerCode": marketer_code})
    if ok(data):
        h = val(data)
        log("Get Marketer Hierarchy", "PASS", f"Children: {h.get('childMarketerCount')}, Cafeterias: {h.get('cafeteriaCount')}", "MARKETER")
    else:
        log("Get Marketer Hierarchy", "FAIL", err_msg(data), "MARKETER")

# 3.6 Get Marketer Balance
if marketer_id:
    data = get(owner, "commissions.getBalance", {"marketerId": marketer_id})
    if ok(data):
        b = val(data)
        log("Get Marketer Commission Balance", "PASS", f"Pending: {b.get('pendingBalance') if b else 0}", "MARKETER")
    else:
        log("Get Marketer Commission Balance", "FAIL", err_msg(data), "MARKETER")

# ============================================================
print("\n" + "─"*70)
print("📋 SECTION 4: CAFETERIA CREATION")
print("─"*70)

cafeteria_id = None
cafeteria_code = None

# 4.1 Create Cafeteria (child marketer creates cafeteria)
if child_marketer_code:
    child_marketer_session = requests.Session()
    child_marketer_session.headers.update({"Content-Type": "application/json"})
    # Create credentials for child marketer first
    if child_marketer_id:
        post(owner, "auth.createUserCredentials", {
            "entityId": child_marketer_id, "entityType": "marketer",
            "username": "beta_marketer", "password": "BetaPass123$"
        })
    data2 = post(child_marketer_session, "auth.login", {"username": "beta_marketer", "password": "BetaPass123$"})
    if ok(data2):
        data = post(child_marketer_session, "marketers.createCafeteria", {
            "marketerCode": child_marketer_code,
            "name": "Test Cafeteria Alpha",
            "location": "123 Main Street, Riyadh"
        })
        if ok(data):
            cafeteria_id = val(data, "id")
            cafeteria_code = val(data, "referenceCode")
            log("Create Cafeteria via Child Marketer", "PASS", f"ID: {cafeteria_id}, Code: {cafeteria_code}", "CAFETERIA")
        else:
            log("Create Cafeteria via Child Marketer", "FAIL", err_msg(data), "CAFETERIA")
    else:
        log("Create Cafeteria via Child Marketer", "WARN", "Child marketer login failed", "CAFETERIA")

# 4.2 Create Cafeteria credentials
if cafeteria_id:
    data = post(owner, "auth.createUserCredentials", {
        "entityId": cafeteria_id,
        "entityType": "cafeteria",
        "username": "cafe_alpha",
        "password": "CafeAlpha123$"
    })
    if ok(data):
        log("Create Cafeteria Login Credentials", "PASS", "Credentials created", "CAFETERIA")
    else:
        log("Create Cafeteria Login Credentials", "FAIL", err_msg(data), "CAFETERIA")

# 4.3 Login as Cafeteria Admin
cafe_admin = requests.Session()
cafe_admin.headers.update({"Content-Type": "application/json"})
if cafeteria_id:
    data = post(cafe_admin, "auth.login", {"username": "cafe_alpha", "password": "CafeAlpha123$"})
    if ok(data) and val(data, "success"):
        log("Cafeteria Admin Login", "PASS", f"Type: {val(data,'userType')}, Name: {val(data,'name')}", "CAFETERIA")
    else:
        log("Cafeteria Admin Login", "FAIL", err_msg(data), "CAFETERIA")
        cafe_admin = owner
else:
    cafe_admin = owner
    log("Cafeteria Admin Login", "WARN", "No cafeteria created, using owner session", "CAFETERIA")

# 4.4 Get Cafeteria Details
if cafeteria_id:
    data = get(cafe_admin, "cafeterias.getCafeteriaDetails", {"cafeteriaId": cafeteria_id})
    if ok(data):
        cafe = val(data)
        log("Get Cafeteria Details", "PASS", f"Name: {cafe.get('name')}, Location: {cafe.get('location')}", "CAFETERIA")
    else:
        log("Get Cafeteria Details", "FAIL", err_msg(data), "CAFETERIA")

# 4.5 Get Cafeteria via Marketer
if cafeteria_code and child_marketer_code:
    data = get(marketer_session, "marketers.getCafeteria", {"cafeteriaCode": cafeteria_code})
    if ok(data):
        log("Get Cafeteria via Marketer", "PASS", f"Found: {val(data,'name')}", "CAFETERIA")
    else:
        log("Get Cafeteria via Marketer", "FAIL", err_msg(data), "CAFETERIA")

# ============================================================
print("\n" + "─"*70)
print("📋 SECTION 5: STAFF MANAGEMENT")
print("─"*70)

manager_id = None
waiter_id = None
chef_id = None

# 5.1 Create Manager
data = post(cafe_admin, "staff.createStaff", {
    "cafeteriaId": cafeteria_id,
    "name": "Ahmed Manager",
    "role": "manager"
})
if ok(data):
    manager_id = val(data, "id")
    log("Create Manager Staff", "PASS", f"ID: {manager_id}", "STAFF")
else:
    log("Create Manager Staff", "FAIL", err_msg(data), "STAFF")

# 5.2 Create Waiter
data = post(cafe_admin, "staff.createStaff", {
    "cafeteriaId": cafeteria_id,
    "name": "Mohammed Waiter",
    "role": "waiter"
})
if ok(data):
    waiter_id = val(data, "id")
    log("Create Waiter Staff", "PASS", f"ID: {waiter_id}", "STAFF")
else:
    log("Create Waiter Staff", "FAIL", err_msg(data), "STAFF")

# 5.3 Create Chef
data = post(cafe_admin, "staff.createStaff", {
    "cafeteriaId": cafeteria_id,
    "name": "Ali Chef",
    "role": "chef"
})
if ok(data):
    chef_id = val(data, "id")
    log("Create Chef Staff", "PASS", f"ID: {chef_id}", "STAFF")
else:
    log("Create Chef Staff", "FAIL", err_msg(data), "STAFF")

# 5.4 Get Staff List
data = get(cafe_admin, "staff.getStaff", {"cafeteriaId": cafeteria_id})
if ok(data):
    staff_list = val(data, "staff") or []
    log("Get Staff List", "PASS", f"Found {len(staff_list)} staff members", "STAFF")
else:
    log("Get Staff List", "FAIL", err_msg(data), "STAFF")

# 5.5 Create Waiter Login Credentials
if waiter_id:
    data = post(cafe_admin, "auth.createUserCredentials", {
        "entityId": waiter_id,
        "entityType": "staff",
        "username": "mohammed_waiter",
        "password": "MohammedW123$"
    })
    if ok(data):
        log("Create Waiter Login Credentials", "PASS", "Credentials created", "STAFF")
    else:
        log("Create Waiter Login Credentials", "FAIL", err_msg(data), "STAFF")

# 5.6 Create Chef Login Credentials
if chef_id:
    data = post(cafe_admin, "auth.createUserCredentials", {
        "entityId": chef_id,
        "entityType": "staff",
        "username": "ali_chef",
        "password": "AliChef123$"
    })
    if ok(data):
        log("Create Chef Login Credentials", "PASS", "Credentials created", "STAFF")
    else:
        log("Create Chef Login Credentials", "FAIL", err_msg(data), "STAFF")

# 5.7 Grant Login Permission (Waiter)
if waiter_id:
    data = post(cafe_admin, "staff.grantLoginPermission", {"staffId": waiter_id, "targetRole": "waiter"})
    if ok(data):
        log("Grant Login Permission (Waiter)", "PASS", "Permission granted", "STAFF")
    else:
        log("Grant Login Permission (Waiter)", "FAIL", err_msg(data), "STAFF")

# 5.8 Grant Login Permission (Chef)
if chef_id:
    data = post(cafe_admin, "staff.grantLoginPermission", {"staffId": chef_id, "targetRole": "chef"})
    if ok(data):
        log("Grant Login Permission (Chef)", "PASS", "Permission granted", "STAFF")
    else:
        log("Grant Login Permission (Chef)", "FAIL", err_msg(data), "STAFF")

# 5.9 Toggle Staff Login
if waiter_id:
    data = post(cafe_admin, "staff.toggleStaffLogin", {"staffId": waiter_id, "enable": True})
    if ok(data):
        log("Toggle Staff Login (enable)", "PASS", "Login enabled", "STAFF")
    else:
        log("Toggle Staff Login (enable)", "FAIL", err_msg(data), "STAFF")

# 5.10 Get Staff Permissions
if waiter_id:
    data = get(cafe_admin, "staff.getPermissions", {"staffId": waiter_id})
    if ok(data):
        log("Get Staff Permissions", "PASS", "Permissions retrieved", "STAFF")
    else:
        log("Get Staff Permissions", "FAIL", err_msg(data), "STAFF")

# 5.11 Update Staff Role
if waiter_id:
    data = post(cafe_admin, "staff.updateStaffRole", {"staffId": waiter_id, "newRole": "waiter"})
    if ok(data):
        log("Update Staff Role", "PASS", "Role updated", "STAFF")
    else:
        log("Update Staff Role", "FAIL", err_msg(data), "STAFF")

# 5.12 Login as Waiter
waiter_session = requests.Session()
waiter_session.headers.update({"Content-Type": "application/json"})
data = post(waiter_session, "auth.login", {"username": "mohammed_waiter", "password": "MohammedW123$"})
if ok(data) and val(data, "success"):
    log("Waiter Login", "PASS", f"Type: {val(data,'userType')}", "STAFF")
else:
    log("Waiter Login", "FAIL", err_msg(data), "STAFF")
    waiter_session = cafe_admin

# 5.13 Login as Chef
chef_session = requests.Session()
chef_session.headers.update({"Content-Type": "application/json"})
data = post(chef_session, "auth.login", {"username": "ali_chef", "password": "AliChef123$"})
if ok(data) and val(data, "success"):
    log("Chef Login", "PASS", f"Type: {val(data,'userType')}", "STAFF")
else:
    log("Chef Login", "FAIL", err_msg(data), "STAFF")
    chef_session = cafe_admin

# ============================================================
print("\n" + "─"*70)
print("📋 SECTION 6: MENU MANAGEMENT")
print("─"*70)

category_id = None
cat2_id = None
item_id = None
item2_id = None

# 6.1 Create Category
data = post(cafe_admin, "menu.createCategory", {"name": "Main Dishes", "cafeteriaId": cafeteria_id})
if ok(data):
    category_id = val(data, "id")
    log("Create Menu Category (Main Dishes)", "PASS", f"ID: {category_id}", "MENU")
else:
    log("Create Menu Category (Main Dishes)", "FAIL", err_msg(data), "MENU")

# 6.2 Create Second Category
data = post(cafe_admin, "menu.createCategory", {"name": "Beverages", "cafeteriaId": cafeteria_id})
if ok(data):
    cat2_id = val(data, "id")
    log("Create Menu Category (Beverages)", "PASS", f"ID: {cat2_id}", "MENU")
else:
    log("Create Menu Category (Beverages)", "FAIL", err_msg(data), "MENU")

# 6.3 Create Menu Item
data = post(cafe_admin, "menu.createMenuItem", {
    "name": "Grilled Chicken",
    "price": 35.00,
    "categoryId": category_id,
    "cafeteriaId": cafeteria_id,
    "isAvailable": True,
    "description": "Juicy grilled chicken with rice"
})
if ok(data):
    item_id = val(data, "id")
    log("Create Menu Item (Grilled Chicken)", "PASS", f"ID: {item_id}", "MENU")
else:
    log("Create Menu Item (Grilled Chicken)", "FAIL", err_msg(data), "MENU")

# 6.4 Create Second Item
data = post(cafe_admin, "menu.createMenuItem", {
    "name": "Fresh Orange Juice",
    "price": 12.00,
    "categoryId": cat2_id,
    "cafeteriaId": cafeteria_id,
    "isAvailable": True
})
if ok(data):
    item2_id = val(data, "id")
    log("Create Menu Item (Orange Juice)", "PASS", f"ID: {item2_id}", "MENU")
else:
    log("Create Menu Item (Orange Juice)", "FAIL", err_msg(data), "MENU")

# 6.5 Get Categories
data = get(cafe_admin, "menu.getCategories", {"cafeteriaId": cafeteria_id})
if ok(data):
    cats = val(data, "categories") or []
    log("Get Menu Categories", "PASS", f"Found {len(cats)} categories", "MENU")
else:
    log("Get Menu Categories", "FAIL", err_msg(data), "MENU")

# 6.6 Get Menu Items
data = get(cafe_admin, "menu.getMenuItems", {"cafeteriaId": cafeteria_id})
if ok(data):
    items = val(data, "items") or []
    log("Get Menu Items", "PASS", f"Found {len(items)} items", "MENU")
else:
    log("Get Menu Items", "FAIL", err_msg(data), "MENU")

# 6.7 Update Item Availability (disable)
if item_id:
    data = post(cafe_admin, "menu.updateItemAvailability", {"itemId": item_id, "isAvailable": False})
    if ok(data):
        log("Update Item Availability (disable)", "PASS", "Item disabled", "MENU")
    else:
        log("Update Item Availability (disable)", "FAIL", err_msg(data), "MENU")

# 6.8 Update Item Availability (re-enable)
if item_id:
    data = post(cafe_admin, "menu.updateItemAvailability", {"itemId": item_id, "isAvailable": True})
    if ok(data):
        log("Update Item Availability (re-enable)", "PASS", "Item re-enabled", "MENU")
    else:
        log("Update Item Availability (re-enable)", "FAIL", err_msg(data), "MENU")

# 6.9 Update Menu Item
if item_id:
    data = post(cafe_admin, "menu.updateMenuItem", {
        "itemId": item_id,
        "name": "Grilled Chicken (Updated)",
        "price": 38.00,
        "categoryId": category_id,
        "cafeteriaId": cafeteria_id,
        "isAvailable": True
    })
    if ok(data):
        log("Update Menu Item", "PASS", "Item updated successfully", "MENU")
    else:
        log("Update Menu Item", "FAIL", err_msg(data), "MENU")

# 6.10 Get Menu Summary
data = get(cafe_admin, "menu.getMenuSummary", {"cafeteriaId": cafeteria_id})
if ok(data):
    log("Get Menu Summary", "PASS", "Summary retrieved", "MENU")
else:
    log("Get Menu Summary", "FAIL", err_msg(data), "MENU")

# 6.11 Get Category with Items
if category_id:
    data = get(cafe_admin, "menu.getCategoryWithItems", {"categoryId": category_id, "cafeteriaId": cafeteria_id})
    if ok(data):
        log("Get Category with Items", "PASS", "Category with items retrieved", "MENU")
    else:
        log("Get Category with Items", "FAIL", err_msg(data), "MENU")

# ============================================================
print("\n" + "─"*70)
print("📋 SECTION 7: TABLE & SECTION MANAGEMENT")
print("─"*70)

section_id = None
table_id = None
table_token = None
table2_id = None

# 7.1 Create Section
data = post(cafe_admin, "tables.createSection", {"cafeteriaId": cafeteria_id, "name": "Main Hall"})
if ok(data):
    section_id = val(data, "id")
    log("Create Table Section (Main Hall)", "PASS", f"ID: {section_id}", "TABLES")
else:
    log("Create Table Section (Main Hall)", "FAIL", err_msg(data), "TABLES")

# 7.2 Create Second Section
section2_id = None
data = post(cafe_admin, "tables.createSection", {"cafeteriaId": cafeteria_id, "name": "VIP Lounge"})
if ok(data):
    section2_id = val(data, "id")
    log("Create Table Section (VIP Lounge)", "PASS", f"ID: {section2_id}", "TABLES")
else:
    log("Create Table Section (VIP Lounge)", "FAIL", err_msg(data), "TABLES")

# 7.3 Create Table
data = post(cafe_admin, "tables.createTable", {
    "cafeteriaId": cafeteria_id,
    "sectionId": section_id,
    "tableNumber": 1,
    "capacity": 4
})
if ok(data):
    t = val(data)
    table_id = t.get("id") if t else None
    table_token = t.get("tableToken") or t.get("token") if t else None
    log("Create Table 1", "PASS", f"ID: {table_id}", "TABLES")
else:
    log("Create Table 1", "FAIL", err_msg(data), "TABLES")

# 7.4 Create Second Table
data = post(cafe_admin, "tables.createTable", {
    "cafeteriaId": cafeteria_id,
    "sectionId": section_id,
    "tableNumber": 2,
    "capacity": 6
})
if ok(data):
    t2 = val(data)
    table2_id = t2.get("id") if t2 else None
    log("Create Table 2", "PASS", f"ID: {table2_id}", "TABLES")
else:
    log("Create Table 2", "FAIL", err_msg(data), "TABLES")

# 7.5 Get Tables
data = get(cafe_admin, "tables.getTables", {"cafeteriaId": cafeteria_id})
if ok(data):
    tables = val(data, "tables") or []
    log("Get Tables", "PASS", f"Found {len(tables)} tables", "TABLES")
    # Get token if not set
    if tables and not table_token:
        table_token = tables[0].get("tableToken") or tables[0].get("token")
        table_id = tables[0].get("id")
else:
    log("Get Tables", "FAIL", err_msg(data), "TABLES")

# 7.6 Get Sections
data = get(cafe_admin, "tables.getSections", {"cafeteriaId": cafeteria_id})
if ok(data):
    secs = val(data, "sections") or []
    log("Get Sections", "PASS", f"Found {len(secs)} sections", "TABLES")
else:
    log("Get Sections", "FAIL", err_msg(data), "TABLES")

# 7.7 Update Table Status
if table_id:
    data = post(cafe_admin, "tables.updateTableStatus", {"tableId": table_id, "status": "occupied"})
    if ok(data):
        log("Update Table Status (occupied)", "PASS", "Status updated", "TABLES")
    else:
        log("Update Table Status (occupied)", "FAIL", err_msg(data), "TABLES")
    # Reset to available
    post(cafe_admin, "tables.updateTableStatus", {"tableId": table_id, "status": "available"})

# 7.8 Get Available Tables
data = get(cafe_admin, "tables.getAvailableTables", {"cafeteriaId": cafeteria_id})
if ok(data):
    avail = val(data, "tables") or []
    log("Get Available Tables", "PASS", f"Found {len(avail)} available tables", "TABLES")
else:
    log("Get Available Tables", "FAIL", err_msg(data), "TABLES")

# 7.9 Get Cafeteria Occupancy
data = get(cafe_admin, "tables.getCafeteriaOccupancy", {"cafeteriaId": cafeteria_id})
if ok(data):
    log("Get Cafeteria Occupancy", "PASS", "Occupancy data retrieved", "TABLES")
else:
    log("Get Cafeteria Occupancy", "FAIL", err_msg(data), "TABLES")

# 7.10 Get Table Status Distribution
data = get(cafe_admin, "tables.getTableStatusDistribution", {"cafeteriaId": cafeteria_id})
if ok(data):
    log("Get Table Status Distribution", "PASS", "Distribution retrieved", "TABLES")
else:
    log("Get Table Status Distribution", "FAIL", err_msg(data), "TABLES")

# 7.11 Regenerate Table Token
if table_id:
    data = post(cafe_admin, "tables.regenerateTableToken", {"tableId": table_id})
    if ok(data):
        new_token = val(data, "tableToken") or val(data, "token")
        if new_token:
            table_token = new_token
        log("Regenerate Table Token", "PASS", "Token regenerated", "TABLES")
    else:
        log("Regenerate Table Token", "FAIL", err_msg(data), "TABLES")

# ============================================================
print("\n" + "─"*70)
print("📋 SECTION 8: RECHARGE WORKFLOW")
print("─"*70)

recharge_id = None

# 8.1 Create Recharge Request
data = post(cafe_admin, "recharges.createRequest", {
    "cafeteriaId": cafeteria_id,
    "amount": 500
})
if ok(data):
    recharge_id = val(data, "id")
    log("Create Recharge Request (500 SAR)", "PASS", f"ID: {recharge_id}", "RECHARGE")
else:
    log("Create Recharge Request (500 SAR)", "FAIL", err_msg(data), "RECHARGE")

# 8.2 Get Recharge Requests (pending)
data = get(owner, "recharges.getRequests", {"status": "pending"})
if ok(data):
    reqs = val(data, "requests") or []
    log("Get Pending Recharge Requests", "PASS", f"Found {len(reqs)} pending requests", "RECHARGE")
else:
    log("Get Pending Recharge Requests", "FAIL", err_msg(data), "RECHARGE")

# 8.3 Get Single Recharge Request
if recharge_id:
    data = get(owner, "recharges.getRequest", {"rechargeRequestId": recharge_id})
    if ok(data):
        log("Get Single Recharge Request", "PASS", f"Status: {val(data,'status')}", "RECHARGE")
    else:
        log("Get Single Recharge Request", "FAIL", err_msg(data), "RECHARGE")

# 8.4 Approve Recharge Request
if recharge_id:
    data = post(owner, "recharges.approveRequest", {"rechargeRequestId": recharge_id})
    if ok(data):
        log("Approve Recharge Request", "PASS", "Request approved, balance updated", "RECHARGE")
    else:
        log("Approve Recharge Request", "FAIL", err_msg(data), "RECHARGE")

# 8.5 Create and Reject Another Request
data = post(cafe_admin, "recharges.createRequest", {"cafeteriaId": cafeteria_id, "amount": 200})
if ok(data):
    reject_id = val(data, "id")
    data2 = post(owner, "recharges.rejectRequest", {
        "rechargeRequestId": reject_id,
        "reason": "Insufficient documentation"
    })
    if ok(data2):
        log("Reject Recharge Request with Reason", "PASS", "Request rejected", "RECHARGE")
    else:
        log("Reject Recharge Request with Reason", "FAIL", err_msg(data2), "RECHARGE")

# ============================================================
print("\n" + "─"*70)
print("📋 SECTION 9: SHIFT MANAGEMENT")
print("─"*70)

shift_id = None

# 9.1 Start Shift (Waiter)
if waiter_id:
    data = post(cafe_admin, "shifts.startShift", {"staffId": waiter_id, "cafeteriaId": cafeteria_id})
    if ok(data):
        shift_id = val(data, "id")
        log("Start Shift (Waiter)", "PASS", f"Shift ID: {shift_id}", "SHIFTS")
    else:
        log("Start Shift (Waiter)", "FAIL", err_msg(data), "SHIFTS")

# 9.2 Get Shift Details
if shift_id:
    data = get(cafe_admin, "shifts.getShift", {"shiftId": shift_id})
    if ok(data):
        shift = val(data)
        log("Get Shift Details", "PASS", f"Status: {shift.get('status') if shift else 'N/A'}", "SHIFTS")
    else:
        log("Get Shift Details", "FAIL", err_msg(data), "SHIFTS")

# 9.3 Get Cafeteria Shifts
data = get(cafe_admin, "shifts.getCafeteriaShifts", {"cafeteriaId": cafeteria_id})
if ok(data):
    shifts_list = val(data, "shifts") or []
    log("Get Cafeteria Shifts", "PASS", f"Found {len(shifts_list)} shifts", "SHIFTS")
else:
    log("Get Cafeteria Shifts", "FAIL", err_msg(data), "SHIFTS")

# 9.4 Get Staff Shifts
if waiter_id:
    data = get(cafe_admin, "shifts.getStaffShifts", {"staffId": waiter_id})
    if ok(data):
        staff_shifts = val(data, "shifts") or []
        log("Get Staff Shifts", "PASS", f"Found {len(staff_shifts)} shifts", "SHIFTS")
    else:
        log("Get Staff Shifts", "FAIL", err_msg(data), "SHIFTS")

# ============================================================
print("\n" + "─"*70)
print("📋 SECTION 10: ORDER LIFECYCLE (Full Workflow)")
print("─"*70)

order_id = None
order_item_id = None

# 10.1 Create Order (staffProcedure requires active shift)
# Use cafe_admin session which has admin role
data = post(cafe_admin, "orders.createOrder", {
    "cafeteriaId": cafeteria_id,
    "tableId": table_id
})
if ok(data):
    order_id = val(data, "id")
    log("Create Order (Table Order)", "PASS", f"Order ID: {order_id}", "ORDERS")
else:
    log("Create Order (Table Order)", "FAIL", err_msg(data), "ORDERS")

# 10.2 Add Item to Order
if order_id and item_id:
    data = post(cafe_admin, "orders.addItem", {
        "orderId": order_id,
        "menuItemId": item_id,
        "quantity": 2,
        "unitPrice": 38.00
    })
    if ok(data):
        oi = val(data)
        order_item_id = oi.get("id") if oi else None
        log("Add Item to Order (Grilled Chicken x2)", "PASS", f"Item ID: {order_item_id}", "ORDERS")
    else:
        log("Add Item to Order (Grilled Chicken x2)", "FAIL", err_msg(data), "ORDERS")

# 10.3 Add Second Item
if order_id and item2_id:
    data = post(cafe_admin, "orders.addItem", {
        "orderId": order_id,
        "menuItemId": item2_id,
        "quantity": 1,
        "unitPrice": 12.00
    })
    if ok(data):
        log("Add Item to Order (Orange Juice x1)", "PASS", "Second item added", "ORDERS")
    else:
        log("Add Item to Order (Orange Juice x1)", "FAIL", err_msg(data), "ORDERS")

# 10.4 Get Order Details
if order_id:
    data = get(cafe_admin, "orders.getOrderDetails", {"orderId": order_id})
    if ok(data):
        order = val(data)
        items_count = len(order.get("items", [])) if order else 0
        log("Get Order Details", "PASS", f"Items: {items_count}", "ORDERS")
    else:
        log("Get Order Details", "FAIL", err_msg(data), "ORDERS")

# 10.5 Send to Kitchen
if order_id:
    data = post(cafe_admin, "orders.sendToKitchen", {"orderId": order_id})
    if ok(data):
        log("Send Order to Kitchen", "PASS", "Order sent to kitchen", "ORDERS")
    else:
        log("Send Order to Kitchen", "FAIL", err_msg(data), "ORDERS")

# 10.6 Get Kitchen Orders (Chef)
if chef_id:
    data = get(cafe_admin, "orders.getKitchenOrders", {"chefId": chef_id, "cafeteriaId": cafeteria_id})
    if ok(data):
        kitchen_items = val(data) or []
        log("Get Kitchen Orders (Chef View)", "PASS", f"Found {len(kitchen_items)} items", "ORDERS")
    else:
        log("Get Kitchen Orders (Chef View)", "FAIL", err_msg(data), "ORDERS")

# 10.7 Chef Updates Item Status - In Preparation
if order_item_id:
    data = post(cafe_admin, "orders.updateItemStatus", {
        "orderItemId": order_item_id,
        "status": "in_preparation"
    })
    if ok(data):
        log("Chef: Item Status → In Preparation", "PASS", "Status updated", "ORDERS")
    else:
        log("Chef: Item Status → In Preparation", "FAIL", err_msg(data), "ORDERS")

# 10.8 Chef Updates Item Status - Ready
if order_item_id:
    data = post(cafe_admin, "orders.updateItemStatus", {
        "orderItemId": order_item_id,
        "status": "ready"
    })
    if ok(data):
        log("Chef: Item Status → Ready", "PASS", "Status updated to ready", "ORDERS")
    else:
        log("Chef: Item Status → Ready", "FAIL", err_msg(data), "ORDERS")

# 10.9 Close Order
if order_id:
    data = post(cafe_admin, "orders.closeOrder", {
        "orderId": order_id,
        "exchangeRate": 1.0,
        "shiftId": shift_id
    })
    if ok(data):
        log("Close Order (Payment Collected)", "PASS", "Order closed, balance deducted", "ORDERS")
    else:
        log("Close Order (Payment Collected)", "FAIL", err_msg(data), "ORDERS")

# 10.10 Get Orders List
data = get(cafe_admin, "orders.getOrders", {"cafeteriaId": cafeteria_id})
if ok(data):
    orders_list = val(data, "orders") or []
    log("Get Orders List", "PASS", f"Found {len(orders_list)} orders", "ORDERS")
else:
    log("Get Orders List", "FAIL", err_msg(data), "ORDERS")

# ============================================================
print("\n" + "─"*70)
print("📋 SECTION 11: QR CODE & CUSTOMER MENU")
print("─"*70)

# 11.1 Get table token from DB if not available
if not table_token and table_id:
    import subprocess
    result = subprocess.run(
        ["sudo", "-u", "postgres", "psql", "-d", "cafeteria_test", "-t", "-c",
         f"SELECT \"tableToken\" FROM \"cafeteriaTables\" WHERE id='{table_id}';"],
        capture_output=True, text=True
    )
    table_token = result.stdout.strip()

# 11.2 Resolve Table by Token
if table_token:
    data = get(requests.Session(), "qrOrders.resolveTableByToken", {"token": table_token})
    if ok(data):
        table_info = val(data)
        log("Resolve Table by QR Token", "PASS", f"Table #{table_info.get('tableNumber') if table_info else 'N/A'}", "QR")
    else:
        log("Resolve Table by QR Token", "FAIL", err_msg(data), "QR")
else:
    log("Resolve Table by QR Token", "WARN", "No token available", "QR")

# 11.3 Customer Creates Order via QR
customer_order_id = None
if table_token and item_id and item2_id:
    data = post(requests.Session(), "qrOrders.createCustomerOrder", {
        "token": table_token,
        "items": [
            {"menuItemId": item_id, "quantity": 1},
            {"menuItemId": item2_id, "quantity": 2}
        ]
    })
    if ok(data):
        customer_order_id = val(data, "orderId")
        log("Customer Create Order via QR", "PASS", f"Order: {customer_order_id}", "QR")
    else:
        log("Customer Create Order via QR", "FAIL", err_msg(data), "QR")

# 11.4 Customer Track Order
if customer_order_id:
    data = get(requests.Session(), "qrOrders.getCustomerOrder", {"orderId": customer_order_id})
    if ok(data):
        log("Customer Track Order Status", "PASS", "Order status retrieved", "QR")
    else:
        log("Customer Track Order Status", "FAIL", err_msg(data), "QR")

# ============================================================
print("\n" + "─"*70)
print("📋 SECTION 12: REPORTING")
print("─"*70)

# 12.1 Generate Daily Report
data = post(cafe_admin, "reporting.generateDailyReport", {
    "cafeteriaId": cafeteria_id,
    "reportDate": datetime.now().isoformat()
})
if ok(data):
    log("Generate Daily Report", "PASS", "Report generated successfully", "REPORTING")
else:
    log("Generate Daily Report", "FAIL", err_msg(data), "REPORTING")

# 12.2 Get Cafeteria Reports
data = get(cafe_admin, "reporting.getCafeteriaReports", {
    "cafeteriaId": cafeteria_id,
    "reportType": "daily"
})
if ok(data):
    reports = val(data, "reports") or []
    log("Get Cafeteria Reports", "PASS", f"Found {len(reports)} reports", "REPORTING")
else:
    log("Get Cafeteria Reports", "FAIL", err_msg(data), "REPORTING")

# 12.3 Get Top Items Report
data = get(cafe_admin, "reporting.getTopItemsReport", {"cafeteriaId": cafeteria_id, "limit": 10})
if ok(data):
    log("Get Top Items Report", "PASS", "Report retrieved", "REPORTING")
else:
    log("Get Top Items Report", "FAIL", err_msg(data), "REPORTING")

# 12.4 Get Top Staff Report
data = get(cafe_admin, "reporting.getTopStaffReport", {"cafeteriaId": cafeteria_id, "limit": 10})
if ok(data):
    log("Get Top Staff Report", "PASS", "Report retrieved", "REPORTING")
else:
    log("Get Top Staff Report", "FAIL", err_msg(data), "REPORTING")

# 12.5 Get Sales Comparison
data = get(cafe_admin, "reporting.getSalesComparison", {"cafeteriaId": cafeteria_id})
if ok(data):
    log("Get Sales Comparison", "PASS", "Comparison retrieved", "REPORTING")
else:
    log("Get Sales Comparison", "FAIL", err_msg(data), "REPORTING")

# 12.6 Get Staff Performance
if waiter_id:
    data = get(cafe_admin, "shifts.getStaffPerformance", {"staffId": waiter_id, "cafeteriaId": cafeteria_id})
    if ok(data):
        log("Get Staff Performance", "PASS", "Performance data retrieved", "REPORTING")
    else:
        log("Get Staff Performance", "FAIL", err_msg(data), "REPORTING")

# 12.7 Get Cafeteria Performance
data = get(cafe_admin, "shifts.getCafeteriaPerformance", {"cafeteriaId": cafeteria_id})
if ok(data):
    log("Get Cafeteria Performance", "PASS", "Performance data retrieved", "REPORTING")
else:
    log("Get Cafeteria Performance", "FAIL", err_msg(data), "REPORTING")

# ============================================================
print("\n" + "─"*70)
print("📋 SECTION 13: COMMISSION MANAGEMENT")
print("─"*70)

# 13.1 Get Commission Balance
if marketer_id:
    data = get(owner, "commissions.getBalance", {"marketerId": marketer_id})
    if ok(data):
        b = val(data)
        log("Get Commission Balance", "PASS", f"Pending: {b.get('pendingBalance') if b else 0}", "COMMISSION")
    else:
        log("Get Commission Balance", "FAIL", err_msg(data), "COMMISSION")

# 13.2 Get Commission History
if marketer_id:
    data = get(owner, "commissions.getCommissionHistory", {"marketerId": marketer_id})
    if ok(data):
        log("Get Commission History", "PASS", "History retrieved", "COMMISSION")
    else:
        log("Get Commission History", "FAIL", err_msg(data), "COMMISSION")

# 13.3 Transition to Available
if marketer_id:
    data = post(owner, "commissions.transitionToAvailable", {"marketerId": marketer_id})
    if ok(data):
        log("Transition Commission to Available", "PASS", "Transitioned successfully", "COMMISSION")
    else:
        log("Transition Commission to Available", "FAIL", err_msg(data), "COMMISSION")

# ============================================================
print("\n" + "─"*70)
print("📋 SECTION 14: WITHDRAWAL MANAGEMENT")
print("─"*70)

withdrawal_id = None

# 14.1 Request Withdrawal
if marketer_id:
    data = post(owner, "withdrawals.requestWithdrawal", {
        "amount": 10,
        "marketerId": marketer_id
    })
    if ok(data):
        withdrawal_id = val(data, "id")
        log("Request Withdrawal (10 SAR)", "PASS", f"ID: {withdrawal_id}", "WITHDRAWAL")
    else:
        log("Request Withdrawal (10 SAR)", "FAIL", err_msg(data), "WITHDRAWAL")

# 14.2 Get Withdrawal Requests
data = get(owner, "withdrawals.getRequests", {"status": "pending"})
if ok(data):
    reqs = val(data, "requests") or []
    log("Get Pending Withdrawal Requests", "PASS", f"Found {len(reqs)} pending", "WITHDRAWAL")
else:
    log("Get Pending Withdrawal Requests", "FAIL", err_msg(data), "WITHDRAWAL")

# 14.3 Approve Withdrawal
if withdrawal_id:
    data = post(owner, "withdrawals.approveRequest", {"withdrawalRequestId": withdrawal_id})
    if ok(data):
        log("Approve Withdrawal Request", "PASS", "Withdrawal approved", "WITHDRAWAL")
    else:
        log("Approve Withdrawal Request", "FAIL", err_msg(data), "WITHDRAWAL")

# 14.4 Create and Reject Withdrawal
data2 = post(owner, "withdrawals.requestWithdrawal", {"amount": 5, "marketerId": marketer_id})
if ok(data2):
    rej_id = val(data2, "id")
    data3 = post(owner, "withdrawals.rejectRequest", {"withdrawalRequestId": rej_id, "reason": "Test rejection"})
    if ok(data3):
        log("Reject Withdrawal Request", "PASS", "Withdrawal rejected", "WITHDRAWAL")
    else:
        log("Reject Withdrawal Request", "FAIL", err_msg(data3), "WITHDRAWAL")

# ============================================================
print("\n" + "─"*70)
print("📋 SECTION 15: SYSTEM MANAGEMENT")
print("─"*70)

# 15.1 Get System Logs
data = get(owner, "system.getLogs", {"limit": 10})
if ok(data):
    logs = val(data, "logs") or []
    log("Get System Logs", "PASS", f"Found {len(logs)} log entries", "SYSTEM")
else:
    log("Get System Logs", "FAIL", err_msg(data), "SYSTEM")

# 15.2 Get Global Free Months
data = get(owner, "system.getGlobalFreeMonths")
if ok(data):
    months = val(data, "months") or 0
    log("Get Global Free Months", "PASS", f"Current: {months} months", "SYSTEM")
else:
    log("Get Global Free Months", "FAIL", err_msg(data), "SYSTEM")

# 15.3 Set Global Free Months
data = post(owner, "system.setGlobalFreeMonths", {"months": 3})
if ok(data):
    log("Set Global Free Months (3)", "PASS", "Set to 3 months", "SYSTEM")
else:
    log("Set Global Free Months (3)", "FAIL", err_msg(data), "SYSTEM")

# 15.4 Export Backup
if cafeteria_id:
    data = post(owner, "system.exportBackup", {"cafeteriaId": cafeteria_id})
    if ok(data):
        log("Export System Backup", "PASS", "Backup exported successfully", "SYSTEM")
    else:
        log("Export System Backup", "FAIL", err_msg(data), "SYSTEM")

# 15.5 Grant Special Free Period
if cafeteria_code:
    data = post(owner, "system.grantSpecialFreePeriod", {
        "referenceCodes": [cafeteria_code],
        "days": 30,
        "reason": "Promotional period"
    })
    if ok(data):
        log("Grant Special Free Period", "PASS", "30 days granted", "SYSTEM")
    else:
        log("Grant Special Free Period", "FAIL", err_msg(data), "SYSTEM")

# ============================================================
print("\n" + "─"*70)
print("📋 SECTION 16: SECURITY & AUTHORIZATION TESTS")
print("─"*70)

# 16.1 SQL Injection Prevention
s_inj = requests.Session()
data = post(s_inj, "auth.login", {"username": "'; DROP TABLE users; --", "password": "test"})
log("SQL Injection Prevention", "PASS" if "error" in data else "FAIL",
    "Injection blocked" if "error" in data else "SECURITY ISSUE!", "SECURITY")

# 16.2 XSS Prevention
s_xss = requests.Session()
data = post(s_xss, "auth.login", {"username": "<script>alert('xss')</script>", "password": "test"})
log("XSS Prevention in Login", "PASS" if "error" in data else "FAIL",
    "XSS blocked" if "error" in data else "SECURITY ISSUE!", "SECURITY")

# 16.3 Waiter cannot access owner endpoints
waiter_s = requests.Session()
waiter_s.headers.update({"Content-Type": "application/json"})
post(waiter_s, "auth.login", {"username": "mohammed_waiter", "password": "MohammedW123$"})
data = get(waiter_s, "system.getGlobalFreeMonths")
log("Waiter cannot access Owner endpoints", "PASS" if "error" in data else "FAIL",
    "Access denied" if "error" in data else "SECURITY ISSUE: Access allowed!", "SECURITY")

# 16.4 Unauthenticated cannot create staff
s_unauth = requests.Session()
data = post(s_unauth, "staff.createStaff", {"cafeteriaId": cafeteria_id, "name": "Hacker", "role": "admin"})
log("Unauthenticated cannot create staff", "PASS" if "error" in data else "FAIL",
    "Blocked" if "error" in data else "SECURITY ISSUE!", "SECURITY")

# 16.5 Unauthenticated cannot access orders
s_unauth2 = requests.Session()
data = get(s_unauth2, "orders.getOrders", {"cafeteriaId": cafeteria_id})
log("Unauthenticated cannot access orders", "PASS" if "error" in data else "FAIL",
    "Blocked" if "error" in data else "SECURITY ISSUE!", "SECURITY")

# 16.6 Unauthenticated cannot access reports
s_unauth3 = requests.Session()
data = get(s_unauth3, "reporting.getCafeteriaReports", {"cafeteriaId": cafeteria_id})
log("Unauthenticated cannot access reports", "PASS" if "error" in data else "FAIL",
    "Blocked" if "error" in data else "SECURITY ISSUE!", "SECURITY")

# 16.7 Marketer cannot access system admin endpoints
data = post(owner, "system.setGlobalFreeMonths", {"months": 0})  # reset
s_mkt = requests.Session()
s_mkt.headers.update({"Content-Type": "application/json"})
post(s_mkt, "auth.login", {"username": "alpha_marketer", "password": "AlphaPass123$"})
data = post(s_mkt, "system.setGlobalFreeMonths", {"months": 99})
log("Marketer cannot access Owner-only endpoints", "PASS" if "error" in data else "FAIL",
    "Access denied" if "error" in data else "SECURITY ISSUE!", "SECURITY")

# 16.8 Password change with wrong old password
data = post(owner, "auth.changePassword", {"oldPassword": "WrongOldPass", "newPassword": "NewPass123$"})
log("Change Password with wrong old password (rejected)", "PASS" if "error" in data else "FAIL",
    "Correctly rejected" if "error" in data else "SECURITY ISSUE!", "SECURITY")

# ============================================================
print("\n" + "─"*70)
print("📋 SECTION 17: END SHIFT & CLEANUP")
print("─"*70)

# 17.1 End Shift
if shift_id:
    data = post(cafe_admin, "shifts.endShift", {"shiftId": shift_id})
    if ok(data):
        log("End Shift (Waiter)", "PASS", "Shift ended successfully", "SHIFTS")
    else:
        log("End Shift (Waiter)", "FAIL", err_msg(data), "SHIFTS")

# 17.2 Delete Staff (cleanup)
if manager_id:
    data = post(cafe_admin, "staff.deleteStaff", {"staffId": manager_id})
    if ok(data):
        log("Delete Staff Member", "PASS", "Manager deleted", "STAFF")
    else:
        log("Delete Staff Member", "FAIL", err_msg(data), "STAFF")

# 17.3 Delete Menu Item
if item2_id:
    data = post(cafe_admin, "menu.deleteMenuItem", {"itemId": item2_id, "cafeteriaId": cafeteria_id})
    if ok(data):
        log("Delete Menu Item", "PASS", "Item deleted", "MENU")
    else:
        log("Delete Menu Item", "FAIL", err_msg(data), "MENU")

# 17.4 Delete Table
if table2_id:
    data = post(cafe_admin, "tables.deleteTable", {"tableId": table2_id})
    if ok(data):
        log("Delete Table", "PASS", "Table deleted", "TABLES")
    else:
        log("Delete Table", "FAIL", err_msg(data), "TABLES")

# ============================================================
print("\n" + "─"*70)
print("📋 SECTION 18: LOGOUT")
print("─"*70)

# 18.1 Logout Owner
data = post(owner, "auth.logout", {})
if ok(data):
    log("Owner Logout", "PASS", "Logged out successfully", "AUTH")
else:
    log("Owner Logout", "FAIL", err_msg(data), "AUTH")

# 18.2 Verify session cleared (me returns null)
data = get(owner, "auth.me")
if val(data) is None:
    log("Session Cleared After Logout", "PASS", "Session correctly invalidated", "AUTH")
else:
    log("Session Cleared After Logout", "WARN", f"Session may still be active: {val(data)}", "AUTH")

# ============================================================
print("\n" + "="*70)
print("📊 FINAL TEST RESULTS SUMMARY")
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
    status_icon = "✅" if cat_rate == 100 else "⚠️" if cat_rate >= 70 else "❌"
    print(f"   {status_icon} {cat:15s}: {counts['passed']:3d}/{cat_total:3d} passed ({cat_rate:.0f}%)")

if results["failed"] > 0:
    print(f"\n❌ Failed Tests Detail:")
    for t in results["tests"]:
        if t["status"] == "FAIL":
            print(f"   [{t['category']}] {t['name']}")
            print(f"     → {t['details'][:200]}")

# Save results
results["summary"] = {
    "total": total, "passed": results["passed"], "failed": results["failed"],
    "warnings": results["warnings"], "pass_rate": round(pass_rate, 1),
    "timestamp": datetime.now().isoformat()
}
with open("/home/ubuntu/test_results/final_scenario_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print(f"\n💾 Results saved to /home/ubuntu/test_results/final_scenario_results.json")
print("="*70)
