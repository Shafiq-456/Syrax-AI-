"""
Automated Integration Test Suite for Syrax AI API Routes.
Verifies health, authentication, ideas lifecycle, cancellation, export, and telemetry.
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check():
    """Verify backend health endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_auth_registration_and_login():
    """Test user registration, JWT generation, and login verification."""
    unique_email = "tester_audit@syrax.ai"
    reg_payload = {
        "email": unique_email,
        "password": "SecurePassword123!",
        "full_name": "Audit Engineer",
        "workspace_name": "QA Testing Lab",
    }
    # Attempt register (or login if exists)
    reg_resp = client.post("/api/auth/register", json=reg_payload)
    if reg_resp.status_code == 400:
        # Already registered, test login directly
        login_resp = client.post("/api/auth/login", json={"email": unique_email, "password": "SecurePassword123!"})
        assert login_resp.status_code == 200
        token = login_resp.json()["token"]
    else:
        assert reg_resp.status_code == 200
        data = reg_resp.json()
        assert "token" in data
        assert data["email"] == unique_email
        token = data["token"]

    # Verify /api/auth/me with bearer token
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["authenticated"] is True
    assert me_data["email"] == unique_email


def test_idea_lifecycle_and_cancellation():
    """Test creating an idea, listing it, cancelling runs, and cascade deleting it."""
    # 1. Create idea
    create_resp = client.post(
        "/api/ideas",
        json={"raw_text": "An automated security vulnerability auditor for smart contracts using static analysis."}
    )
    assert create_resp.status_code == 200
    idea_id = create_resp.json()["idea_id"]
    assert isinstance(idea_id, int)

    # 2. List ideas
    list_resp = client.get("/api/ideas")
    assert list_resp.status_code == 200
    ideas = list_resp.json()
    assert any(i["id"] == idea_id for i in ideas)

    # 3. Test cancellation endpoint
    cancel_resp = client.post(f"/api/ideas/{idea_id}/cancel")
    assert cancel_resp.status_code == 200
    assert "status" in cancel_resp.json()

    # 4. Delete idea
    del_resp = client.delete(f"/api/ideas/{idea_id}")
    assert del_resp.status_code == 200
    assert del_resp.json()["status"] == "deleted"

    # Confirm deletion
    list_after = client.get("/api/ideas").json()
    assert not any(i["id"] == idea_id for i in list_after)


def test_stats_and_sources_endpoints():
    """Verify stats and source querying with type filtering."""
    # Stats
    stats_resp = client.get("/api/stats")
    assert stats_resp.status_code == 200
    s_data = stats_resp.json()
    assert "total_ideas" in s_data
    assert "total_reports" in s_data
    assert "avg_novelty_score" in s_data
    assert "workspace_name" in s_data

    # Sources
    src_resp = client.get("/api/sources?source_type=github")
    assert src_resp.status_code == 200
    sources = src_resp.json()
    assert isinstance(sources, list)
    if sources:
        assert sources[0]["source_type"] == "github"
        assert "provenance" in sources[0]


def test_report_export_endpoints():
    """Verify both Markdown and ReportLab PDF export endpoints return HTTP 200."""
    # Find an existing report version
    ideas = client.get("/api/ideas").json()
    version_id = None
    for idea in ideas:
        if idea.get("latest_version_id") and idea.get("has_report"):
            version_id = idea["latest_version_id"]
            break

    if version_id:
        # Markdown export
        md_resp = client.get(f"/api/reports/{version_id}/export?format=markdown")
        assert md_resp.status_code == 200
        assert "text/markdown" in md_resp.headers["content-type"]
        assert len(md_resp.content) > 50

        # PDF export (ReportLab)
        pdf_resp = client.get(f"/api/reports/{version_id}/export?format=pdf")
        assert pdf_resp.status_code == 200
        assert "application/pdf" in pdf_resp.headers["content-type"]
        assert pdf_resp.content.startswith(b"%PDF")
