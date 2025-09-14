from langchain_experimental.agents.agent_toolkits import create_csv_agent
from helper.load_llm import LLM_MODEL

def initialize_agent(file, api_key):
    if file is None or api_key.strip() == "":
        return None, "⚠ Please Enter your API key and Upload the CSV Data/File"

    try:
        agent = create_csv_agent(
            llm=LLM_MODEL,
            path=file.name,
            agent_type="openai-tools",
            allow_dangerous_code=True,
            agent_executor_kwargs=dict(handle_parsing_errors=True)
        )
        return agent, "🟢 Data Uploded and Agent is Ready to Answer!"
    except Exception as e:
        return None, f"🔴 Oops!! Error Occured because of: {e}"