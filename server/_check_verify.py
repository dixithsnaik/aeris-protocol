from app import create_app

client = create_app().test_client()
res = client.post("/auth/verify", json={"phone": "9876543210", "otp": "000000"})
body = res.get_json() or {}
print(res.status_code, "token" if body.get("token") else body.get("error", "no-body"))
