import os
import requests

def check_models():
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("ANTHROPIC_API_KEY not found in environment.")
        return

    url = "https://api.anthropic.com/v1/models"
    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01"
    }

    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            models = response.json()
            print("Available models:")
            for model in models.get("data", []):
                print(f"- {model['id']}")
        else:
            print(f"Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Exception: {str(e)}")

if __name__ == "__main__":
    check_models()
