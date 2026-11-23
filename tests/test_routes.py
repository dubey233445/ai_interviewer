import io
import pytest
from app import app


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_index_route(client):
    response = client.get("/")
    assert response.status_code == 200
    assert b"Mock" in response.data


def test_interview_route(client):
    response = client.get("/interview")
    assert response.status_code == 200
    assert b"Live Session" in response.data


def test_report_route(client):
    response = client.get("/report")
    assert response.status_code == 200
    assert b"Performance" in response.data


def test_start_interview_without_file(client):
    response = client.post("/start-interview")
    assert response.status_code == 400
    assert b"Please upload your resume to continue" in response.data


def test_start_interview_with_txt_file(client):
    data = {
        "resume": (io.BytesIO(b"Candidate resume content with experience in Python and Flask"), "resume.txt")
    }
    response = client.post("/start-interview", data=data, content_type="multipart/form-data")
    assert response.status_code == 302
    assert "/interview?resume_id=" in response.headers["Location"]
