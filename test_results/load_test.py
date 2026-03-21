#!/usr/bin/env python3
"""CAFETERIA V2 - LOAD & STRESS TEST SUITE"""

import requests
import json
import time
import threading
import concurrent.futures
import statistics
import urllib.parse
import subprocess
from datetime import datetime

BASE_URL = "http://localhost:3000"
TRPC_URL = f"{BASE_URL}/api/trpc"
lock = threading.Lock()
load_results = {"scenarios": {}, "summary": {}}

def get_req(endpoint, params=None, cookies=None):
    url = f"{TRPC_URL}/{endpoint}"
    if params:
        url += f"?input={urllib.parse.quote(json.dumps({'json': params}))}"
    try:
        start = time.time()
        r = requests.get(url, cookies=cookies, timeout=15)
        elapsed = time.time() - start
        return {"status": r.status_code, "time": elapsed, "ok": r.status_code == 200}
    except Exception as e:
        return {"status": 0, "time": 15, "ok": False, "error": str(e)}

def post_req(endpoint, data, cookies=None):
    url = f"{TRPC_URL}/{endpoint}"
    try:
        start = time.time()
        headers = {"Content-Type": "application/json"}
        r = requests.post(url, json={"json": data}, headers=headers, cookies=cookies, timeout=15)
        elapsed = time.time() - start
        resp_data = r.json()
        success = "result" in resp_data and "error" not in resp_data
        return {"status": r.status_code, "time": elapsed, "ok": success, "data": resp_data}
    except Exception as e:
        return {"status": 0, "time": 15, "ok": False, "error": str(e)}

def run_scenario(scenario_name, func, num_users):
    print(f"\n  Running: {scenario_name} ({num_users} concurrent users)")
    results = []
    
    def worker(user_id):
        result = func(user_id)
        with lock:
            results.append(result)
    
    start_time = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=min(num_users, 200)) as executor:
        futures = [executor.submit(worker, i) for i in range(num_users)]
        concurrent.futures.wait(futures)
    total_time = time.time() - start_time
    
    if results:
        times = [r["time"] for r in results]
        success_count = sum(1 for r in results if r.get("ok"))
        sorted_times = sorted(times)
        p95_idx = max(0, int(len(times) * 0.95) - 1)
        
        scenario_data = {
            "users": num_users,
            "total_requests": len(results),
            "successful": success_count,
            "failed": len(results) - success_count,
            "success_rate": round(success_count / len(results) * 100, 1),
            "total_time": round(total_time, 2),
            "avg_response": round(statistics.mean(times), 3),
            "min_response": round(min(times), 3),
            "max_response": round(max(times), 3),
            "p95_response": round(sorted_times[p95_idx], 3),
            "throughput": round(len(results) / total_time, 1),
        }
        load_results["scenarios"][scenario_name] = scenario_data
        
        status = "PASS" if scenario_data["success_rate"] >= 95 else "WARN" if scenario_data["success_rate"] >= 80 else "FAIL"
        icon = "OK" if status == "PASS" else "!!" if status == "WARN" else "XX"
        print(f"  [{icon}] Success: {scenario_data['success_rate']}% | Avg: {scenario_data['avg_response']}s | P95: {scenario_data['p95_response']}s | Throughput: {scenario_data['throughput']} req/s")
        return scenario_data
    return {}

print("\n" + "="*70)
print("CAFETERIA V2 - LOAD & STRESS TEST SUITE")
print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("="*70)

# Setup owner session
owner_session = requests.Session()
owner_session.headers.update({"Content-Type": "application/json"})
login_resp = owner_session.post(f"{TRPC_URL}/auth.login", json={"json": {"username": "yaserras@gmail.com", "password": "Kamel123321$"}})
owner_cookies = dict(owner_session.cookies)
print(f"\n  Owner session: {'OK' if login_resp.status_code == 200 else 'FAILED'}")

# SCENARIO 1: Health Check Baseline
print("\n--- SCENARIO 1: HEALTH CHECK BASELINE ---")
def health_check(uid): return get_req("system.health")
run_scenario("Health Check - 1 user baseline", health_check, 1)
run_scenario("Health Check - 10 concurrent", health_check, 10)
run_scenario("Health Check - 50 concurrent", health_check, 50)
run_scenario("Health Check - 100 concurrent", health_check, 100)
run_scenario("Health Check - 200 concurrent", health_check, 200)

# SCENARIO 2: Concurrent Login
print("\n--- SCENARIO 2: CONCURRENT LOGIN ---")
def concurrent_login(uid):
    return post_req("auth.login", {"username": "yaserras@gmail.com", "password": "Kamel123321$"})
run_scenario("Concurrent Login - 10 users", concurrent_login, 10)
run_scenario("Concurrent Login - 25 users", concurrent_login, 25)
run_scenario("Concurrent Login - 50 users", concurrent_login, 50)

# SCENARIO 3: Concurrent Reads
print("\n--- SCENARIO 3: CONCURRENT API READS ---")
def read_api(uid): return get_req("system.health", cookies=owner_cookies)
run_scenario("Concurrent Reads - 50 users", read_api, 50)
run_scenario("Concurrent Reads - 100 users", read_api, 100)
run_scenario("Concurrent Reads - 200 users", read_api, 200)

# SCENARIO 4: Mixed Workload
print("\n--- SCENARIO 4: MIXED WORKLOAD ---")
def mixed_workload(uid):
    if uid % 3 == 0:
        return post_req("auth.login", {"username": "yaserras@gmail.com", "password": "Kamel123321$"})
    return get_req("system.health")
run_scenario("Mixed Workload - 30 users", mixed_workload, 30)
run_scenario("Mixed Workload - 60 users", mixed_workload, 60)
run_scenario("Mixed Workload - 100 users", mixed_workload, 100)

# SCENARIO 5: Sustained Load (30 seconds)
print("\n--- SCENARIO 5: SUSTAINED LOAD TEST (30 seconds) ---")
sustained_results = []
def sustained_worker(duration):
    end = time.time() + duration
    local = []
    while time.time() < end:
        local.append(get_req("system.health"))
        time.sleep(0.05)
    with lock:
        sustained_results.extend(local)

print(f"\n  Running: Sustained Load - 10 workers for 30 seconds")
threads = [threading.Thread(target=sustained_worker, args=(30,)) for _ in range(10)]
start = time.time()
for t in threads: t.start()
for t in threads: t.join()
elapsed = time.time() - start

if sustained_results:
    times = [r["time"] for r in sustained_results]
    success = sum(1 for r in sustained_results if r.get("ok"))
    p95 = sorted(times)[int(len(times)*0.95)]
    scenario_data = {
        "users": 10, "total_requests": len(sustained_results),
        "successful": success, "failed": len(sustained_results)-success,
        "success_rate": round(success/len(sustained_results)*100,1),
        "total_time": round(elapsed,2),
        "avg_response": round(statistics.mean(times),3),
        "p95_response": round(p95,3),
        "throughput": round(len(sustained_results)/elapsed,1),
    }
    load_results["scenarios"]["Sustained Load - 10 workers 30s"] = scenario_data
    icon = "OK" if scenario_data["success_rate"] >= 95 else "!!"
    print(f"  [{icon}] Total: {len(sustained_results)} reqs | Success: {scenario_data['success_rate']}% | Avg: {scenario_data['avg_response']}s | Throughput: {scenario_data['throughput']} req/s")

# SCENARIO 6: Spike Test
print("\n--- SCENARIO 6: SPIKE TEST ---")
def spike_test():
    print(f"\n  Running: Spike Test - 150 users simultaneous burst")
    results = []
    def w(): 
        r = get_req("system.health")
        with lock: results.append(r)
    threads = [threading.Thread(target=w) for _ in range(150)]
    start = time.time()
    for t in threads: t.start()
    for t in threads: t.join()
    elapsed = time.time() - start
    if results:
        times = [r["time"] for r in results]
        success = sum(1 for r in results if r.get("ok"))
        scenario_data = {
            "users": 150, "total_requests": 150,
            "successful": success, "failed": 150-success,
            "success_rate": round(success/150*100,1),
            "total_time": round(elapsed,2),
            "avg_response": round(statistics.mean(times),3),
            "max_response": round(max(times),3),
            "p95_response": round(sorted(times)[int(150*0.95)],3),
            "throughput": round(150/elapsed,1),
        }
        load_results["scenarios"]["Spike Test - 150 users burst"] = scenario_data
        icon = "OK" if scenario_data["success_rate"] >= 90 else "!!"
        print(f"  [{icon}] Success: {scenario_data['success_rate']}% | Avg: {scenario_data['avg_response']}s | Max: {scenario_data['max_response']}s | Throughput: {scenario_data['throughput']} req/s")

spike_test()

# SCENARIO 7: Concurrent Writes
print("\n--- SCENARIO 7: CONCURRENT WRITE OPERATIONS ---")
write_counter = {"n": 0}
def concurrent_write(uid):
    with lock:
        write_counter["n"] += 1
        n = write_counter["n"]
    return post_req("marketers.createRootMarketer", {
        "name": f"LT Marketer {n}", "country": "SA", "currency": "SAR", "language": "ar"
    }, cookies=owner_cookies)
run_scenario("Concurrent Writes - 10 users", concurrent_write, 10)
run_scenario("Concurrent Writes - 20 users", concurrent_write, 20)

# SCENARIO 8: System Resources
print("\n--- SCENARIO 8: SYSTEM RESOURCES ---")
result = subprocess.run(["free", "-m"], capture_output=True, text=True)
print(f"\n  System Memory:\n{result.stdout}")

result2 = subprocess.run(["ps", "aux", "--no-headers"], capture_output=True, text=True)
node_procs = [l for l in result2.stdout.split('\n') if 'tsx' in l or ('node' in l and 'cafeteria' in l)]
print(f"  Server Processes:")
for p in node_procs[:3]:
    parts = p.split()
    if len(parts) > 5:
        print(f"    CPU: {parts[2]}% | MEM: {parts[3]}% | CMD: {' '.join(parts[10:12])}")

# SCENARIO 9: Recovery Test
print("\n--- SCENARIO 9: RECOVERY TEST ---")
print("  Waiting 5 seconds for system recovery...")
time.sleep(5)
def recovery(uid): return get_req("system.health")
run_scenario("Recovery - 10 users after stress", recovery, 10)

# SUMMARY
print("\n" + "="*70)
print("LOAD TEST RESULTS SUMMARY")
print("="*70)

print(f"\n{'Scenario':<52} {'Users':>5} {'Succ%':>6} {'Avg(s)':>7} {'P95(s)':>7} {'Req/s':>7}")
print("-"*85)
for name, data in load_results["scenarios"].items():
    sr = data.get("success_rate", 0)
    icon = "OK" if sr >= 95 else "!!" if sr >= 80 else "XX"
    print(f"[{icon}] {name[:50]:<50} {data.get('users',0):>5} {sr:>6.1f}% "
          f"{data.get('avg_response',0):>7.3f} {data.get('p95_response',data.get('avg_response',0)):>7.3f} "
          f"{data.get('throughput',0):>7.1f}")

all_rates = [d.get("success_rate",0) for d in load_results["scenarios"].values()]
if all_rates:
    avg_sr = statistics.mean(all_rates)
    min_sr = min(all_rates)
    print(f"\nOverall: Avg Success={avg_sr:.1f}% | Min Success={min_sr:.1f}%")
    if avg_sr >= 95: print("RATING: EXCELLENT - System handles load very well")
    elif avg_sr >= 85: print("RATING: GOOD - System handles load adequately")
    elif avg_sr >= 70: print("RATING: FAIR - System shows stress under high load")
    else: print("RATING: POOR - System struggles under load")

load_results["summary"] = {
    "timestamp": datetime.now().isoformat(),
    "total_scenarios": len(load_results["scenarios"]),
    "avg_success_rate": round(statistics.mean(all_rates),1) if all_rates else 0,
    "min_success_rate": round(min(all_rates),1) if all_rates else 0,
}

with open("/home/ubuntu/test_results/load_test_results.json", "w", encoding="utf-8") as f:
    json.dump(load_results, f, indent=2, ensure_ascii=False)

print(f"\nResults saved to /home/ubuntu/test_results/load_test_results.json")
print("="*70)
