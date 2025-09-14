from langchain_openai import ChatOpenAI
from config.configurations import MODEL_NAME, API_KEY, BASE_URL, TEMPERATURE

LLM_MODEL = ChatOpenAI(
    temperature=TEMPERATURE, 
    model=MODEL_NAME,
    base_url=BASE_URL,
    api_key=API_KEY
)