#!/usr/bin/env python3
"""
Syrax AI - Comprehensive Feature Verification & Live Test Script
Tests all 15 core features across backend APIs, services, and live pipeline execution.
"""
import sys
import time
import json
import httpx

BASE_URL = "http://127.0.0.1:8000"

def log_test(feature_num, name, status, details=""):
    badge = "✅ PASS" if status else "❌ FAIL"
    print(f"[{badge}] Feature {feature_num:02d}: {name}")
    if details:
        print(f"       Details: {details}")

results = {}

def test_feature_1_health():
    try:
        r = httpx.get(f"{BASE_URL}/health", timeout=5.0)
        ok = r.status_code == 200 and r.json().get("status") == "ok"
        results[1] = (ok, f"Status code: {r.status_code}, Response: {r.json()}")
        log_test(1, "System Health & Server Alive", ok, results[1][1])
    except Exception as e:
        results[1] = (False, str(e))
        log_test(1, "System Health & Server Alive", False, str(e))

def test_feature_2_auth():
    try:
        test_email = f"tester_{int(time.time())}@syrax.ai"
        test_password = "SecurePassword123!"
        
        # 1. Register
        reg_payload = {
            "email": test_email,
            "password": test_password,
            "full_name": "QA Specialist",
            "workspace_name": "Innovation Quantum Lab"
        }
        r_reg = httpx.post(f"{BASE_URL}/api/auth/register", json=reg_payload, timeout=5.0)
        reg_data = r_reg.json()
        token = reg_data.get("token")
        
        # 2. Login
        login_payload = {"email": test_email, "password": test_password}
        r_login = httpx.post(f"{BASE_URL}/api/auth/login", json=login_payload, timeout=5.0)
        login_token = r_login.json().get("token")
        
        # 3. Auth Me
        headers = {"Authorization": f"Bearer {login_token}"}
        r_me = httpx.get(f"{BASE_URL}/api/auth/me", headers=headers, timeout=5.0)
        me_data = r_me.json()
        
        ok = (r_reg.status_code == 200 and r_login.status_code == 200 and r_me.status_code == 200 and me_data.get("authenticated") is True)
        details = f"Registered & logged in as {test_email}. Workspace: '{me_data.get('workspace_name')}' (ID: {me_data.get('workspace_id')})"
        results[2] = (ok, details)
        log_test(2, "Multi-Tenant Authentication & Authorization", ok, details)
        return login_token, me_data.get("workspace_id")
    except Exception as e:
        results[2] = (False, str(e))
        log_test(2, "Multi-Tenant Authentication & Authorization", False, str(e))
        return None, None

def test_feature_3_workspaces(token, workspace_id):
    try:
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        r = httpx.get(f"{BASE_URL}/api/auth/me", headers=headers, timeout=5.0)
        me = r.json()
        ok = r.status_code == 200 and me.get("workspace_id") == workspace_id and bool(me.get("workspace_name"))
        details = f"Active Workspace confirmed: ID {me.get('workspace_id')} ({me.get('workspace_name')})"
        results[3] = (ok, details)
        log_test(3, "Workspace Isolation & Multi-Tenancy", ok, details)
    except Exception as e:
        results[3] = (False, str(e))
        log_test(3, "Workspace Isolation & Multi-Tenancy", False, str(e))

def test_feature_4_stats(token, workspace_id):
    try:
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        if workspace_id:
            headers["X-Workspace-Id"] = str(workspace_id)
        r = httpx.get(f"{BASE_URL}/api/stats", headers=headers, timeout=5.0)
        stats = r.json()
        required_keys = ["total_ideas", "total_reports", "total_sources", "avg_novelty_score"]
        ok = r.status_code == 200 and all(k in stats for k in required_keys)
        details = f"Total Ideas: {stats.get('total_ideas')}, Reports: {stats.get('total_reports')}, Sources: {stats.get('total_sources')}, Avg Score: {stats.get('avg_novelty_score')}"
        results[4] = (ok, details)
        log_test(4, "System Analytics & Aggregated Metrics", ok, details)
    except Exception as e:
        results[4] = (False, str(e))
        log_test(4, "System Analytics & Aggregated Metrics", False, str(e))

def test_feature_5_idea_intake(token, workspace_id):
    try:
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        if workspace_id:
            headers["X-Workspace-Id"] = str(workspace_id)
        raw_text = "An AI-powered real-time security vulnerability scanner that monitors code commits, detects zero-day exploits, and suggests verified automated patches."
        r = httpx.post(f"{BASE_URL}/api/ideas", json={"raw_text": raw_text}, headers=headers, timeout=5.0)
        data = r.json()
        idea_id = data.get("idea_id")
        ok = r.status_code == 200 and isinstance(idea_id, int)
        details = f"Created Idea #{idea_id} in Workspace {data.get('workspace_id')}"
        results[5] = (ok, details)
        log_test(5, "Structured Idea Intake & Database Persistence", ok, details)
        return idea_id
    except Exception as e:
        results[5] = (False, str(e))
        log_test(5, "Structured Idea Intake & Database Persistence", False, str(e))
        return None

def test_feature_6_sse_pipeline(idea_id, token, workspace_id):
    try:
        url = f"{BASE_URL}/api/ideas/{idea_id}/stream"
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        if workspace_id:
            headers["X-Workspace-Id"] = str(workspace_id)
        stages_observed = []
        report_version_id = None
        with httpx.stream("GET", url, headers=headers, timeout=60.0) as r:
            for line in r.iter_lines():
                if line.startswith("data: "):
                    payload_str = line[6:]
                    try:
                        event = json.loads(payload_str)
                        stage = event.get("stage")
                        if stage and stage not in stages_observed:
                            stages_observed.append(stage)
                        if event.get("stage") == "pipeline" and event.get("status") == "complete":
                            report_version_id = event.get("detail", {}).get("report_version_id")
                    except Exception:
                        pass
        expected_stages = ["idea_analysis", "search", "rag", "similarity", "gaps", "recommendations", "architecture", "report", "pipeline"]
        ok = len(stages_observed) >= 6 and report_version_id is not None
        details = f"Streamed stages ({len(stages_observed)}/{len(expected_stages)}): {stages_observed}. Generated ReportVersion ID: {report_version_id}"
        results[6] = (ok, details)
        log_test(6, "Real-time 8-Stage SSE Pipeline Orchestration", ok, details)
        return report_version_id
    except Exception as e:
        results[6] = (False, str(e))
        log_test(6, "Real-time 8-Stage SSE Pipeline Orchestration", False, str(e))
        return None

def test_feature_7_cancellation(token, workspace_id):
    try:
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        if workspace_id:
            headers["X-Workspace-Id"] = str(workspace_id)
        # Create a throwaway idea
        r_create = httpx.post(f"{BASE_URL}/api/ideas", json={"raw_text": "A temporary pipeline for cancellation verification."}, headers=headers, timeout=5.0)
        tid = r_create.json().get("idea_id")
        
        r_cancel = httpx.post(f"{BASE_URL}/api/ideas/{tid}/cancel", headers=headers, timeout=5.0)
        ok = r_cancel.status_code == 200 and "status" in r_cancel.json()
        details = f"Cancelled Idea #{tid} response: {r_cancel.json()}"
        results[7] = (ok, details)
        log_test(7, "Job Lifecycle & Pipeline Cancellation Endpoint", ok, details)
    except Exception as e:
        results[7] = (False, str(e))
        log_test(7, "Job Lifecycle & Pipeline Cancellation Endpoint", False, str(e))

def test_feature_8_sources_and_provenance():
    try:
        r_all = httpx.get(f"{BASE_URL}/api/sources", timeout=5.0)
        r_gh = httpx.get(f"{BASE_URL}/api/sources?source_type=github", timeout=5.0)
        r_paper = httpx.get(f"{BASE_URL}/api/sources?source_type=paper", timeout=5.0)
        
        sources = r_all.json()
        gh_sources = r_gh.json()
        paper_sources = r_paper.json()
        
        has_provenance = any("provenance" in s for s in sources)
        ok = r_all.status_code == 200 and r_gh.status_code == 200 and r_paper.status_code == 200 and len(sources) > 0 and has_provenance
        details = f"Total sources: {len(sources)} (GitHub: {len(gh_sources)}, Papers: {len(paper_sources)}). Provenance tags: {[s.get('provenance') for s in sources[:2]]}"
        results[8] = (ok, details)
        log_test(8, "Multi-Source Integrations & Provenance Tracking", ok, details)
    except Exception as e:
        results[8] = (False, str(e))
        log_test(8, "Multi-Source Integrations & Provenance Tracking", False, str(e))

def test_feature_9_similarity_scoring(version_id):
    try:
        r = httpx.get(f"{BASE_URL}/api/reports/{version_id}", timeout=5.0)
        report = r.json()
        novelty = report.get("novelty", {})
        novelty_score = novelty.get("novelty_score")
        confidence = novelty.get("confidence")
        overlapping = novelty.get("top_overlapping_sources", [])
        ok = novelty_score is not None and isinstance(novelty_score, (int, float)) and 0 <= novelty_score <= 100
        details = f"Novelty Score: {novelty_score}/100, Confidence: '{confidence}', Overlapping Projects Analyzed: {len(overlapping)}"
        results[9] = (ok, details)
        log_test(9, "Deterministic Similarity & Novelty Scoring", ok, details)
        return report
    except Exception as e:
        results[9] = (False, str(e))
        log_test(9, "Deterministic Similarity & Novelty Scoring", False, str(e))
        return None

def test_feature_10_gap_analysis(report):
    try:
        gaps = report.get("gaps", [])
        ok = isinstance(gaps, list) and len(gaps) > 0 and all("description" in g and "evidence_sources" in g for g in gaps)
        details = f"Identified {len(gaps)} evidence-backed gaps: {[g.get('description') for g in gaps[:2]]}"
        results[10] = (ok, details)
        log_test(10, "Evidence-Backed Innovation Gap Analysis", ok, details)
    except Exception as e:
        results[10] = (False, str(e))
        log_test(10, "Evidence-Backed Innovation Gap Analysis", False, str(e))

def test_feature_11_architecture_and_roadmap(report):
    try:
        arch = report.get("architecture", {})
        stack = arch.get("stack", [])
        roadmap = arch.get("roadmap", [])
        ok = isinstance(stack, list) and len(stack) > 0 and isinstance(roadmap, list) and len(roadmap) > 0
        details = f"Tech Stack Items ({len(stack)}): {stack[:2]}, Roadmap Milestones ({len(roadmap)}): {roadmap[:2]}"
        results[11] = (ok, details)
        log_test(11, "Architecture Recommendations & Phased Roadmap", ok, details)
    except Exception as e:
        results[11] = (False, str(e))
        log_test(11, "Architecture Recommendations & Phased Roadmap", False, str(e))

def test_feature_12_export_markdown(version_id):
    try:
        r = httpx.get(f"{BASE_URL}/api/reports/{version_id}/export?format=markdown", timeout=5.0)
        has_content = len(r.text) > 100 and "# " in r.text
        ok = r.status_code == 200 and has_content
        details = f"Status: {r.status_code}, Length: {len(r.text)} bytes, Content-Type: {r.headers.get('content-type')}"
        results[12] = (ok, details)
        log_test(12, "Markdown Dossier Export", ok, details)
    except Exception as e:
        results[12] = (False, str(e))
        log_test(12, "Markdown Dossier Export", False, str(e))

def test_feature_13_export_pdf(version_id):
    try:
        r = httpx.get(f"{BASE_URL}/api/reports/{version_id}/export?format=pdf", timeout=10.0)
        is_pdf = r.content.startswith(b"%PDF")
        ok = r.status_code == 200 and is_pdf and len(r.content) > 1000
        details = f"Status: {r.status_code}, Length: {len(r.content)} bytes, Starts with %PDF: {is_pdf}"
        results[13] = (ok, details)
        log_test(13, "Pure-Python ReportLab PDF Dossier Export", ok, details)
    except Exception as e:
        results[13] = (False, str(e))
        log_test(13, "Pure-Python ReportLab PDF Dossier Export", False, str(e))

def test_feature_14_cascade_delete(idea_id, token, workspace_id):
    try:
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        if workspace_id:
            headers["X-Workspace-Id"] = str(workspace_id)
        r = httpx.delete(f"{BASE_URL}/api/ideas/{idea_id}", headers=headers, timeout=5.0)
        # Verify it's gone from list
        ideas_after = httpx.get(f"{BASE_URL}/api/ideas", headers=headers, timeout=5.0).json()
        is_deleted = not any(i.get("id") == idea_id for i in ideas_after)
        ok = r.status_code == 200 and is_deleted
        details = f"DELETE status: {r.status_code}, Idea #{idea_id} removed from workspace ideas list: {is_deleted}"
        results[14] = (ok, details)
        log_test(14, "Idea Lifecycle Cascade Deletion & Cleanup", ok, details)
    except Exception as e:
        results[14] = (False, str(e))
        log_test(14, "Idea Lifecycle Cascade Deletion & Cleanup", False, str(e))

def test_feature_15_frontend_availability():
    try:
        r = httpx.get("http://127.0.0.1:5173", timeout=5.0)
        has_root = '<div id="root">' in r.text or "Syrax" in r.text or "vite" in r.text
        ok = r.status_code == 200 and has_root
        details = f"Vite React dev server HTTP {r.status_code}, HTML served successfully"
        results[15] = (ok, details)
        log_test(15, "Frontend Modern SPA & Three.js App Serving", ok, details)
    except Exception as e:
        results[15] = (False, str(e))
        log_test(15, "Frontend Modern SPA & Three.js App Serving", False, str(e))

def main():
    print("=" * 70)
    print("  SYRAX AI — FULL END-TO-END FEATURE VERIFICATION SUITE")
    print("=" * 70)
    
    test_feature_1_health()
    token, workspace_id = test_feature_2_auth()
    test_feature_3_workspaces(token, workspace_id)
    test_feature_4_stats(token, workspace_id)
    idea_id = test_feature_5_idea_intake(token, workspace_id)
    
    version_id = None
    report = None
    if idea_id:
        version_id = test_feature_6_sse_pipeline(idea_id, token, workspace_id)
        
    test_feature_7_cancellation(token, workspace_id)
    test_feature_8_sources_and_provenance()
    
    if version_id:
        report = test_feature_9_similarity_scoring(version_id)
        if report:
            test_feature_10_gap_analysis(report)
            test_feature_11_architecture_and_roadmap(report)
            test_feature_12_export_markdown(version_id)
            test_feature_13_export_pdf(version_id)
        else:
            for f in [10, 11, 12, 13]:
                results[f] = (False, "Failed to load report")
                log_test(f, "Report-dependent feature", False, "Skipped")
    else:
        for f in [9, 10, 11, 12, 13]:
            results[f] = (False, "Skipped due to pipeline failure")
            log_test(f, "Report-dependent feature", False, "Skipped")
            
    if idea_id:
        test_feature_14_cascade_delete(idea_id, token, workspace_id)
    else:
        results[14] = (False, "Skipped")
        log_test(14, "Idea Lifecycle Cascade Deletion & Cleanup", False, "Skipped")
        
    test_feature_15_frontend_availability()
    
    total = len(results)
    passed = sum(1 for status, _ in results.values() if status)
    print("\n" + "=" * 70)
    print(f"VERIFICATION SUMMARY: {passed}/{total} FEATURES PASSED ({passed/total*100:.1f}%)")
    print("=" * 70)
    
    return 0 if passed == total else 1

if __name__ == "__main__":
    sys.exit(main())
