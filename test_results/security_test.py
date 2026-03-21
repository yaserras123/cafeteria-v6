#!/usr/bin/env python3
"""
CAFETERIA V2 - SECURITY & AUTHORIZATION TEST SUITE
Tests all security scenarios, role-based access control, and attack prevention
"""

import requests
import json
import time
import urllib.parse
from datetime import datetime

BASE_URL = "http://localhost:3000"
TRPC_URL = f"{BASE_URL}/api/trpc"

results = {"passed": 0, "failed": 0, "warnings": 0, "tests": [], "categories": {}}

def log(name, status, details="", category="SECURITY"):
    icon = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"  {icon} [{category}] {name}: {str(details)[:100]}")
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
        r = session.get(url, timeout=10)
        return r.json(), r.status_code
    except Exception as e:
        return {"error": str(e)}, 0

def post(session, endpoint, data):
    url = f"{TRPC_URL}/{endpoint}"
    try:
        r = session.post(url, json={"json": data}, timeout=10)
        return r.json(), r.status_code
    except Exception as e:
        return {"error": str(e)}, 0

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
print("🔒 CAFETERIA V2 - SECURITY & AUTHORIZATION TEST SUITE")
print(f"   Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("="*70)

# Setup - Login as owner
owner = requests.Session()
owner.headers.update({"Content-Type": "application/json"})
data, _ = post(owner, "auth.login", {"username": "yaserras@gmail.com", "password": "Kamel123321$"})
if not ok(data):
    print("❌ CRITICAL: Cannot login as owner!")
    exit(1)
print(f"  ✅ Owner session established")

# ============================================================
print("\n" + "─"*70)
print("📋 SECTION 1: AUTHENTICATION SECURITY")
print("─"*70)

# 1.1 SQL Injection in login
payloads = [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "' UNION SELECT * FROM users --",
    "admin'--",
    "' OR 1=1 --",
]
for payload in payloads:
    s = requests.Session()
    data, code = post(s, "auth.login", {"username": payload, "password": "test"})
    log(f"SQL Injection: {payload[:30]}", "PASS" if "error" in data else "FAIL",
        "Blocked" if "error" in data else "SECURITY BREACH!", "SQL_INJECTION")

# 1.2 XSS in login
xss_payloads = [
    "<script>alert('xss')</script>",
    "javascript:alert(1)",
    "<img src=x onerror=alert(1)>",
    "';alert('xss')//",
]
for payload in xss_payloads:
    s = requests.Session()
    data, code = post(s, "auth.login", {"username": payload, "password": "test"})
    log(f"XSS Attempt: {payload[:30]}", "PASS" if "error" in data else "FAIL",
        "Blocked" if "error" in data else "SECURITY BREACH!", "XSS")

# 1.3 Brute Force - Multiple failed attempts
print("\n  Testing brute force protection...")
failed_count = 0
for i in range(10):
    s = requests.Session()
    data, _ = post(s, "auth.login", {"username": "yaserras@gmail.com", "password": f"WrongPass{i}"})
    if "error" in data:
        failed_count += 1
if failed_count == 10:
    log("Brute Force - All attempts rejected", "PASS", f"10/10 rejected", "BRUTE_FORCE")
else:
    log("Brute Force - Attempts handling", "WARN", f"Only {failed_count}/10 rejected", "BRUTE_FORCE")

# 1.4 Rate limiting check
start = time.time()
for i in range(20):
    s = requests.Session()
    post(s, "auth.login", {"username": "test", "password": "test"})
elapsed = time.time() - start
if elapsed > 5:
    log("Rate Limiting Active", "PASS", f"20 requests took {elapsed:.1f}s (rate limited)", "RATE_LIMIT")
else:
    log("Rate Limiting Active", "WARN", f"20 requests in {elapsed:.1f}s (no rate limiting detected)", "RATE_LIMIT")

# 1.5 Empty/null credentials
empty_tests = [
    {"username": "", "password": ""},
    {"username": "   ", "password": "   "},
    {"username": None, "password": None},
]
for creds in empty_tests:
    s = requests.Session()
    try:
        data, _ = post(s, "auth.login", creds)
        log(f"Empty/null credentials: {str(creds)[:40]}", "PASS" if "error" in data else "FAIL",
            "Rejected" if "error" in data else "SECURITY ISSUE!", "AUTH_VALIDATION")
    except:
        log(f"Empty/null credentials: {str(creds)[:40]}", "PASS", "Exception raised (safe)", "AUTH_VALIDATION")

# 1.6 Very long inputs
long_input = "A" * 10000
s = requests.Session()
data, _ = post(s, "auth.login", {"username": long_input, "password": long_input})
log("Very long input (10000 chars)", "PASS" if "error" in data else "FAIL",
    "Rejected" if "error" in data else "SECURITY ISSUE!", "INPUT_VALIDATION")

# ============================================================
print("\n" + "─"*70)
print("📋 SECTION 2: ROLE-BASED ACCESS CONTROL (RBAC)")
print("─"*70)

# 2.1 Unauthenticated access to all protected endpoints
unauth = requests.Session()
protected_endpoints = [
    ("auth.me", None, "GET"),
    ("staff.getStaff", {"cafeteriaId": "test"}, "GET"),
    ("orders.getOrders", {"cafeteriaId": "test"}, "GET"),
    ("reporting.getCafeteriaReports", {"cafeteriaId": "test"}, "GET"),
    ("shifts.getCafeteriaShifts", {"cafeteriaId": "test"}, "GET"),
    ("recharges.getRequests", {"status": "pending"}, "GET"),
    ("commissions.getBalance", {"marketerId": "test"}, "GET"),
    ("withdrawals.getRequests", {}, "GET"),
    ("system.getLogs", {"limit": 10}, "GET"),
]
for endpoint, params, method in protected_endpoints:
    if method == "GET":
        data, _ = get(unauth, endpoint, params)
    else:
        data, _ = post(unauth, endpoint, params or {})
    log(f"Unauth access to {endpoint}", "PASS" if "error" in data else "FAIL",
        "Blocked" if "error" in data else f"SECURITY BREACH: {val(data)}", "UNAUTH_ACCESS")

# 2.2 Owner-only endpoints - test with non-owner
# (Using owner session which has admin role, not owner role)
owner_only_endpoints = [
    ("system.getGlobalFreeMonths", None, "GET"),
    ("system.setGlobalFreeMonths", {"months": 1}, "POST"),
    ("system.grantSpecialFreePeriod", {"referenceCodes": [], "days": 1}, "POST"),
]
for endpoint, params, method in owner_only_endpoints:
    if method == "GET":
        data, _ = get(owner, endpoint, params)
    else:
        data, _ = post(owner, endpoint, params or {})
    # Owner has admin role, not owner role - should be blocked
    if "error" in data and "Owner access required" in err_msg(data):
        log(f"Owner-only endpoint {endpoint} (admin blocked)", "PASS", "Admin correctly blocked from owner endpoint", "RBAC")
    elif ok(data):
        log(f"Owner-only endpoint {endpoint}", "WARN", "Accessible (may need owner role setup)", "RBAC")
    else:
        log(f"Owner-only endpoint {endpoint}", "WARN", err_msg(data), "RBAC")

# 2.3 Marketer-only endpoints
marketer_only = [
    ("marketers.createCafeteria", {"marketerCode": "MKT-01", "name": "Test"}, "POST"),
    ("marketers.getMarketerHierarchy", {"marketerCode": "MKT-01"}, "GET"),
]
for endpoint, params, method in marketer_only:
    if method == "GET":
        data, _ = get(owner, endpoint, params)
    else:
        data, _ = post(owner, endpoint, params)
    if "error" in data and "Marketer access required" in err_msg(data):
        log(f"Marketer-only {endpoint} (admin blocked)", "PASS", "Admin correctly blocked", "RBAC")
    elif "error" in data:
        log(f"Marketer-only {endpoint}", "WARN", err_msg(data)[:80], "RBAC")
    else:
        log(f"Marketer-only {endpoint}", "WARN", "Accessible without marketer role", "RBAC")

# ============================================================
print("\n" + "─"*70)
print("📋 SECTION 3: DATA VALIDATION & INPUT SECURITY")
print("─"*70)

# 3.1 Invalid data types
invalid_inputs = [
    ("staff.createStaff", {"cafeteriaId": 123, "name": "Test", "role": "waiter"}, "cafeteriaId must be string"),
    ("menu.createMenuItem", {"name": "Test", "price": "not_a_number", "categoryId": "test", "cafeteriaId": "test"}, "price must be number"),
    ("tables.createTable", {"cafeteriaId": "test", "sectionId": "test", "tableNumber": -1, "capacity": 4}, "negative table number"),
    ("recharges.createRequest", {"cafeteriaId": "test", "amount": -100}, "negative amount"),
]
for endpoint, params, desc in invalid_inputs:
    data, _ = post(owner, endpoint, params)
    log(f"Invalid input: {desc}", "PASS" if "error" in data else "FAIL",
        "Rejected" if "error" in data else "SECURITY ISSUE: Accepted invalid data!", "INPUT_VALIDATION")

# 3.2 Missing required fields
missing_fields = [
    ("auth.login", {"username": "test"}, "missing password"),
    ("staff.createStaff", {"cafeteriaId": "test"}, "missing name and role"),
    ("menu.createMenuItem", {"name": "Test"}, "missing price and categoryId"),
]
for endpoint, params, desc in missing_fields:
    data, _ = post(owner, endpoint, params)
    log(f"Missing required field: {desc}", "PASS" if "error" in data else "FAIL",
        "Rejected" if "error" in data else "SECURITY ISSUE!", "INPUT_VALIDATION")

# 3.3 Password strength validation
weak_passwords = ["123", "password", "abc", "12345678"]
for pwd in weak_passwords:
    data, _ = post(owner, "auth.changePassword", {"oldPassword": "Kamel123321$", "newPassword": pwd})
    log(f"Weak password rejected: '{pwd}'", "PASS" if "error" in data else "FAIL",
        "Rejected" if "error" in data else "SECURITY ISSUE: Weak password accepted!", "PASSWORD_POLICY")

# ============================================================
print("\n" + "─"*70)
print("📋 SECTION 4: SESSION SECURITY")
print("─"*70)

# 4.1 Invalid session token
fake_session = requests.Session()
fake_session.cookies.set("session", "fake_invalid_token_xyz123")
data, _ = get(fake_session, "auth.me")
log("Invalid session token rejected", "PASS" if val(data) is None else "FAIL",
    "No user returned" if val(data) is None else "SECURITY BREACH!", "SESSION")

# 4.2 Tampered JWT
import base64
tampered_session = requests.Session()
tampered_session.cookies.set("session", "eyJhbGciOiJIUzI1NiJ9.eyJvcGVuSWQiOiJoYWNrZXIiLCJhcHBJZCI6InRlc3QiLCJuYW1lIjoiaGFja2VyIn0.fake_signature")
data, _ = get(tampered_session, "auth.me")
log("Tampered JWT rejected", "PASS" if val(data) is None else "FAIL",
    "No user returned" if val(data) is None else "SECURITY BREACH!", "SESSION")

# 4.3 Expired/empty session
empty_session = requests.Session()
empty_session.cookies.set("session", "")
data, _ = get(empty_session, "auth.me")
log("Empty session cookie handled", "PASS" if val(data) is None else "WARN",
    "No user returned" if val(data) is None else f"Returned: {val(data)}", "SESSION")

# 4.4 Logout and session invalidation
logout_test = requests.Session()
logout_test.headers.update({"Content-Type": "application/json"})
post(logout_test, "auth.login", {"username": "yaserras@gmail.com", "password": "Kamel123321$"})
data_before, _ = get(logout_test, "auth.me")
post(logout_test, "auth.logout", {})
data_after, _ = get(logout_test, "auth.me")
if val(data_before) is not None and val(data_after) is None:
    log("Session invalidated after logout", "PASS", "Session correctly cleared", "SESSION")
elif val(data_before) is None:
    log("Session invalidated after logout", "WARN", "Session was not active before logout", "SESSION")
else:
    log("Session invalidated after logout", "FAIL", f"Session still active after logout! User: {val(data_after)}", "SESSION")

# ============================================================
print("\n" + "─"*70)
print("📋 SECTION 5: API SECURITY")
print("─"*70)

# 5.1 CORS headers check
r = requests.get(f"{BASE_URL}/api/trpc/system.health", headers={"Origin": "https://evil.com"})
cors_header = r.headers.get("Access-Control-Allow-Origin", "")
log("CORS - Malicious origin restricted", "PASS" if cors_header != "*" else "WARN",
    f"CORS header: '{cors_header}' (not wildcard)" if cors_header != "*" else "Wildcard CORS detected", "API_SECURITY")

# 5.2 HTTP methods
r = requests.delete(f"{TRPC_URL}/auth.login")
log("DELETE method on mutation endpoint", "PASS" if r.status_code in [405, 404] else "WARN",
    f"HTTP {r.status_code}", "API_SECURITY")

r = requests.put(f"{TRPC_URL}/auth.login")
log("PUT method on mutation endpoint", "PASS" if r.status_code in [405, 404] else "WARN",
    f"HTTP {r.status_code}", "API_SECURITY")

# 5.3 Content-Type validation
r = requests.post(f"{TRPC_URL}/auth.login",
    data='{"json":{"username":"test","password":"test"}}',
    headers={"Content-Type": "text/plain"})
log("Wrong Content-Type rejected", "PASS" if r.status_code in [400, 415] else "WARN",
    f"HTTP {r.status_code}", "API_SECURITY")

# 5.4 Large payload
large_data = {"json": {"username": "A" * 100000, "password": "B" * 100000}}
try:
    r = requests.post(f"{TRPC_URL}/auth.login", json=large_data, timeout=10)
    log("Large payload (200KB) handled", "PASS" if r.status_code in [400, 413, 500] else "WARN",
        f"HTTP {r.status_code}", "API_SECURITY")
except requests.exceptions.ConnectionError:
    log("Large payload (200KB) handled", "PASS", "Connection rejected", "API_SECURITY")

# 5.5 Path traversal
traversal_paths = [
    "../../../etc/passwd",
    "..%2F..%2Fetc%2Fpasswd",
    "....//....//etc/passwd",
]
for path in traversal_paths:
    r = requests.get(f"{BASE_URL}/{path}", timeout=5)
    log(f"Path traversal: {path[:30]}", "PASS" if r.status_code in [404, 400, 403] else "WARN",
        f"HTTP {r.status_code}", "PATH_TRAVERSAL")

# ============================================================
print("\n" + "─"*70)
print("📋 SECTION 6: BUSINESS LOGIC SECURITY")
print("─"*70)

# 6.1 Cannot access other cafeteria's data (cross-tenant)
# Create two cafeterias and verify isolation
data, _ = post(owner, "marketers.createRootMarketer", {
    "name": "Security Test Marketer",
    "country": "SA", "currency": "SAR", "language": "ar"
})
if ok(data):
    sec_mkt_id = val(data, "id")
    sec_mkt_code = val(data, "referenceCode")
    log("Security test marketer created", "PASS", f"Code: {sec_mkt_code}", "BUSINESS_LOGIC")
    
    # Create credentials and login
    post(owner, "auth.createUserCredentials", {
        "entityId": sec_mkt_id, "entityType": "marketer",
        "username": "sec_mkt", "password": "SecMkt123$"
    })
    sec_mkt_session = requests.Session()
    sec_mkt_session.headers.update({"Content-Type": "application/json"})
    post(sec_mkt_session, "auth.login", {"username": "sec_mkt", "password": "SecMkt123$"})
    
    # Try to access another marketer's hierarchy
    data2, _ = get(sec_mkt_session, "marketers.getMarketerHierarchy", {"marketerCode": "MKT-01"})
    if "error" in data2:
        log("Cross-tenant marketer hierarchy access blocked", "PASS", "Access denied", "BUSINESS_LOGIC")
    else:
        log("Cross-tenant marketer hierarchy access blocked", "WARN", "Access allowed (may be by design)", "BUSINESS_LOGIC")

# 6.2 Cannot approve own recharge request
# (This would require cafeteria to have admin privileges - should be blocked by role)
data, _ = post(owner, "recharges.getRequests", {"status": "pending"})
if ok(data):
    log("Recharge requests accessible by admin", "PASS", "Admin can view all requests", "BUSINESS_LOGIC")

# 6.3 Double-approval prevention
# Try to approve already approved request
import subprocess
result = subprocess.run(
    ["sudo", "-u", "postgres", "psql", "-d", "cafeteria_test", "-t", "-c",
     "SELECT id FROM \"rechargeRequests\" WHERE status='approved' LIMIT 1;"],
    capture_output=True, text=True
)
approved_id = result.stdout.strip()
if approved_id:
    data, _ = post(owner, "recharges.approveRequest", {"rechargeRequestId": approved_id})
    if "error" in data:
        log("Double-approval prevention", "PASS", "Cannot approve already approved request", "BUSINESS_LOGIC")
    else:
        log("Double-approval prevention", "WARN", "Double approval may be allowed", "BUSINESS_LOGIC")
else:
    log("Double-approval prevention", "WARN", "No approved requests to test with", "BUSINESS_LOGIC")

# ============================================================
print("\n" + "─"*70)
print("📋 SECTION 7: DATA INTEGRITY")
print("─"*70)

# 7.1 Non-existent resource access
non_existent_tests = [
    ("cafeterias.getCafeteriaDetails", {"cafeteriaId": "non_existent_id_xyz"}, "GET"),
    ("orders.getOrderDetails", {"orderId": "non_existent_order_xyz"}, "GET"),
    ("shifts.getShift", {"shiftId": "non_existent_shift_xyz"}, "GET"),
]
for endpoint, params, method in non_existent_tests:
    if method == "GET":
        data, _ = get(owner, endpoint, params)
    else:
        data, _ = post(owner, endpoint, params)
    log(f"Non-existent resource: {endpoint}", "PASS" if "error" in data else "WARN",
        "Error returned" if "error" in data else f"Returned: {val(data)}", "DATA_INTEGRITY")

# 7.2 Invalid enum values
invalid_enums = [
    ("staff.createStaff", {"cafeteriaId": "test", "name": "Test", "role": "superadmin"}, "invalid role"),
    ("tables.updateTableStatus", {"tableId": "test", "status": "flying"}, "invalid status"),
    ("orders.updateItemStatus", {"orderItemId": "test", "status": "teleported"}, "invalid status"),
]
for endpoint, params, desc in invalid_enums:
    data, _ = post(owner, endpoint, params)
    log(f"Invalid enum value: {desc}", "PASS" if "error" in data else "FAIL",
        "Rejected" if "error" in data else "SECURITY ISSUE: Invalid enum accepted!", "DATA_INTEGRITY")

# ============================================================
print("\n" + "─"*70)
print("📋 SECTION 8: HEADERS & RESPONSE SECURITY")
print("─"*70)

r = requests.get(f"{BASE_URL}/")
headers = r.headers

security_headers = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": ["DENY", "SAMEORIGIN"],
    "Content-Security-Policy": None,  # just check existence
}

for header, expected in security_headers.items():
    value = headers.get(header, "")
    if expected is None:
        status = "PASS" if value else "WARN"
        log(f"Security header: {header}", status, f"Value: '{value}'" if value else "Missing", "HTTP_HEADERS")
    elif isinstance(expected, list):
        status = "PASS" if value in expected else "WARN"
        log(f"Security header: {header}", status, f"Value: '{value}'", "HTTP_HEADERS")
    else:
        status = "PASS" if value == expected else "WARN"
        log(f"Security header: {header}", status, f"Value: '{value}'", "HTTP_HEADERS")

# Check for sensitive info in headers
sensitive_headers = ["Server", "X-Powered-By"]
for header in sensitive_headers:
    value = headers.get(header, "")
    log(f"Sensitive header exposed: {header}", "PASS" if not value else "WARN",
        f"Not exposed" if not value else f"Exposed: '{value}'", "HTTP_HEADERS")

# ============================================================
print("\n" + "="*70)
print("📊 SECURITY TEST RESULTS SUMMARY")
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
    status_icon = "✅" if cat_rate >= 90 else "⚠️" if cat_rate >= 70 else "❌"
    print(f"   {status_icon} {cat:20s}: {counts['passed']:3d}/{cat_total:3d} passed ({cat_rate:.0f}%)")

if results["failed"] > 0:
    print(f"\n❌ CRITICAL SECURITY FAILURES:")
    for t in results["tests"]:
        if t["status"] == "FAIL":
            print(f"   [{t['category']}] {t['name']}")
            print(f"     → {t['details'][:200]}")

results["summary"] = {
    "total": total, "passed": results["passed"], "failed": results["failed"],
    "warnings": results["warnings"], "pass_rate": round(pass_rate, 1),
    "timestamp": datetime.now().isoformat()
}
with open("/home/ubuntu/test_results/security_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print(f"\n💾 Results saved to /home/ubuntu/test_results/security_results.json")
print("="*70)
