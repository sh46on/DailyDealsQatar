import os
import requests

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL")


def send_company_credentials(to_email, password, company_name):
    RESEND_API_KEY = os.getenv("RESEND_API_KEY")
    FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL")

    url = "https://api.resend.com/emails"

    payload = {
        "from": FROM_EMAIL,
        "to": [to_email],
        "subject": f"{company_name} Account Approved 🎉",
        "html": f"""
        <h2>Your Company Has Been Approved</h2>
        <p><strong>Company:</strong> {company_name}</p>
        <p><strong>Email:</strong> {to_email}</p>
        <p><strong>Password:</strong> {password}</p>
        <b>USE PHONE AND PASSWORD FOR LOGIN</b>
        <br/>
        <p>Please login and change your password.</p>
        """,
    }

    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json",
    }

    response = requests.post(url, json=payload, headers=headers)

    return response
