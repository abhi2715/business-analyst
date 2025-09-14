from utils.get_chat import chat as chat_util
from utils.init_agent import initialize_agent as init_agent_util

class CSVChatBot:
    def __init__(self):
        self.agent = None
        self.file_path = None

    def chat(self, message, history):
        return chat_util(self.agent, message)

    def initialize_agent(self, file, api_key):
        self.agent, response = init_agent_util(file, api_key)
        if self.agent:
            self.file_path = file.name
        return response