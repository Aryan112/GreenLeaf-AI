from google import genai
from google.genai.errors import ServerError
from dotenv import load_dotenv
import time
import os

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

MODEL = "gemini-3.5-flash-lite"


def generate_text(prompt: str) -> str:

    last_error = None

    for attempt in range(3):

        try:
            response = client.models.generate_content(
                model=MODEL,
                contents=prompt
            )

            return response.text

        except ServerError as e:
            last_error = e
            print(f"Gemini temporary error (Attempt {attempt+1}/3)")
            time.sleep(2)

        except Exception:
            raise

    raise last_error