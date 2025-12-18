import sys
import pathlib
import copy
import pytest
from fastapi.testclient import TestClient

# ensure src is importable
ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
sys.path.insert(0, str(SRC))

from app import app, activities

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_activities():
    orig = copy.deepcopy(activities)
    yield
    activities.clear()
    activities.update(orig)


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    # expect some known activities
    assert "Basketball" in data


def test_signup_success():
    email = "teststudent@example.com"
    # ensure not present
    if email in activities["Basketball"]["participants"]:
        activities["Basketball"]["participants"].remove(email)

    res = client.post(f"/activities/Basketball/signup?email={email}")
    assert res.status_code == 200
    body = res.json()
    assert "Signed up" in body.get("message", "")
    assert email in activities["Basketball"]["participants"]


def test_signup_duplicate():
    email = "duplicate@example.com"
    # add once
    if email not in activities["Soccer"]["participants"]:
        activities["Soccer"]["participants"].append(email)

    # attempt to sign up again
    res = client.post(f"/activities/Soccer/signup?email={email}")
    assert res.status_code == 400
    body = res.json()
    assert "already signed up" in body.get("detail", "")


def test_signup_unknown_activity():
    res = client.post("/activities/NonExistent/signup?email=user@example.com")
    assert res.status_code == 404
    body = res.json()
    assert "Activity not found" in body.get("detail", "")
