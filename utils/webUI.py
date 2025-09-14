from helper.model_class import CSVChatBot

csv_chatbot = CSVChatBot()

def user(user_message, history):
    return "", history + [[user_message, None]]

def bot(history):
    user_message = history[-1][0]
    bot_message = csv_chatbot.chat(user_message, history)
    history[-1][1] = bot_message
    return history

def clear_chat():
    return []