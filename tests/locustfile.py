"""
DeepStegAI V2 — Locust Load Testing Script
Phase 3: Performance + Stress Testing
Usage: locust -f locustfile.py --host=http://localhost:5000
"""

from locust import HttpUser, task, between, events
import io
import json
import base64
import os
from PIL import Image


# ── Minimal green PNG for testing ──────────────────────────────────────────
def make_test_png(w=200, h=200) -> bytes:
    img = Image.new("RGB", (w, h), color=(100, 200, 100))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


PNG_BYTES = make_test_png()
PNG_SMALL = make_test_png(100, 100)
PNG_MED = make_test_png(256, 256)


class DeepStegAIUser(HttpUser):
    """
    Simulates a real user performing steganography operations.
    Wait time: 1-3s between actions (realistic pacing).
    """
    wait_time = between(1, 3)
    token = None

    def on_start(self):
        """Login and acquire JWT before any request."""
        email = f"load_user_{id(self)}@locust.io"
        password = "LoadTest123!"

        # Register
        self.client.post("/api/auth/register", json={
            "email": email,
            "password": password,
            "name": "Load Tester"
        })

        # Login
        resp = self.client.post("/api/auth/login", json={
            "email": email,
            "password": password
        })
        if resp.status_code == 200:
            try:
                self.token = resp.json()["data"]["access_token"]
            except Exception:
                self.token = None

    def auth_headers(self):
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}

    # ── HIGH FREQUENCY TASKS ─────────────────────────────────────────────────

    @task(5)
    def t_health_check(self):
        """Lightweight health check — highest frequency."""
        self.client.get("/api/health")

    @task(3)
    def t_get_credits(self):
        self.client.get("/api/credits", headers=self.auth_headers(), name="/api/credits")

    @task(3)
    def t_get_activity(self):
        self.client.get("/api/activity", headers=self.auth_headers(), name="/api/activity")

    @task(3)
    def t_global_stats(self):
        self.client.get("/api/stats/global", name="/api/stats/global")

    @task(2)
    def t_capacity_check(self):
        self.client.post(
            "/api/capacity",
            files={"cover": ("c.png", io.BytesIO(PNG_SMALL), "image/png")},
            name="/api/capacity",
        )

    # ── MEDIUM FREQUENCY ─────────────────────────────────────────────────────

    @task(2)
    def t_lsb_embed(self):
        """Standard LSB embed — moderate load."""
        resp = self.client.post(
            "/api/embed",
            headers=self.auth_headers(),
            files={
                "cover": ("c.png", io.BytesIO(PNG_MED), "image/png"),
                "secret": ("s.txt", io.BytesIO(b"Locust load test secret payload"), "text/plain"),
            },
            data={"method": "LSB"},
            name="/api/embed [LSB]",
        )
        if resp.status_code == 200:
            try:
                stego_b64 = resp.json()["data"]["image_data"]
                # Store for extraction cycle
                self._last_stego = base64.b64decode(stego_b64)
            except Exception:
                self._last_stego = None

    @task(1)
    def t_extract_after_embed(self):
        """Extract from previously embedded image."""
        stego = getattr(self, "_last_stego", None)
        if not stego:
            return
        self.client.post(
            "/api/extract",
            headers=self.auth_headers(),
            files={"stego": ("stego.png", io.BytesIO(stego), "image/png")},
            name="/api/extract",
        )

    @task(2)
    def t_steg_analyze(self):
        """Single-image AI analysis."""
        self.client.post(
            "/api/analyze",
            headers=self.auth_headers(),
            files={"image": ("i.png", io.BytesIO(PNG_SMALL), "image/png")},
            name="/api/analyze",
        )

    # ── LOW FREQUENCY (HEAVY OPERATIONS) ─────────────────────────────────────

    @task(1)
    def t_batch_analyze_3_images(self):
        """Batch analyze 3 images — heavier operation."""
        files = [("images", (f"img_{i}.png", io.BytesIO(PNG_SMALL), "image/png")) for i in range(3)]
        self.client.post(
            "/api/batch_analyze",
            headers=self.auth_headers(),
            files=files,
            name="/api/batch_analyze [3imgs]",
        )

    @task(1)
    def t_difference_heatmap(self):
        """Difference heatmap endpoint."""
        cover = PNG_MED
        # Create a simple stego manually (just the same image — heatmap will be flat)
        self.client.post(
            "/api/heatmap/difference",
            headers=self.auth_headers(),
            files={
                "cover": ("c.png", io.BytesIO(cover), "image/png"),
                "stego": ("s.png", io.BytesIO(cover), "image/png"),
            },
            name="/api/heatmap/difference",
        )


class StressTestUser(HttpUser):
    """
    Stress test: rapid-fire requests to saturate the API.
    No wait time — full throughput test.
    """
    wait_time = between(0, 0.5)
    token = None

    def on_start(self):
        email = f"stress_{id(self)}@locust.io"
        self.client.post("/api/auth/register", json={
            "email": email, "password": "Stress123!", "name": "Stress"
        })
        resp = self.client.post("/api/auth/login", json={
            "email": email, "password": "Stress123!"
        })
        if resp.status_code == 200:
            self.token = resp.json()["data"]["access_token"]

    def auth_headers(self):
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}

    @task(10)
    def t_rapid_health(self):
        self.client.get("/api/health", name="/api/health [stress]")

    @task(3)
    def t_rapid_capacity(self):
        self.client.post(
            "/api/capacity",
            files={"cover": ("c.png", io.BytesIO(PNG_SMALL), "image/png")},
            name="/api/capacity [stress]",
        )

    @task(2)
    def t_rapid_analyze(self):
        self.client.post(
            "/api/analyze",
            headers=self.auth_headers(),
            files={"image": ("i.png", io.BytesIO(PNG_SMALL), "image/png")},
            name="/api/analyze [stress]",
        )


# ── EVENTS — Performance Monitoring ────────────────────────────────────────

@events.request.add_listener
def on_request(request_type, name, response_time, response_length, response, exception, **kwargs):
    """Log any slow requests (> 5s) or 5xx errors."""
    if exception:
        print(f"[LOCUST ERROR] {request_type} {name}: {exception}")
    elif response and response.status_code >= 500:
        print(f"[LOCUST 5xx] {request_type} {name} → {response.status_code}")
    elif response_time > 5000:
        print(f"[LOCUST SLOW] {request_type} {name}: {response_time:.0f}ms")
