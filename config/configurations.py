from dotenv import load_dotenv
import os
load_dotenv()

MODEL_NAME = os.getenv("MODEL_NAME")
BASE_URL = os.getenv("BASE_URL")
API_KEY = os.getenv("API_KEY")
TEMPERATURE = os.getenv("TEMPERATURE")