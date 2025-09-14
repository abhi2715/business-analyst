import gradio as gr
from helper.model_class import CSVChatBot
from utils.webUI import user, bot, clear_chat

def create_csv_chatbot_ui():
    csv_chatbot = CSVChatBot()

    with gr.Blocks(theme=gr.themes.Soft(primary_hue="indigo", secondary_hue="blue")) as demo:
        gr.Markdown(
            """
            # 📊 CSV Analysis Chatbot  
            Upload your CSV, connect with your API key, and start chatting with your data.  
            """
        )

        # Setup Tab
        with gr.Tab("🔑 Setup"):
            with gr.Row():
                file_input = gr.File(label="📂 Upload CSV File", file_types=[".csv"])
                api_key_input = gr.Textbox(
                    label="🔑 OpenRouter API Key", 
                    type="password", 
                    placeholder="Enter your API key here..."
                )
            initialize_button = gr.Button("🚀 Initialize Agent", variant="primary")
            init_output = gr.Textbox(
                label="Initialization Status", 
                interactive=False,
                placeholder="Status will appear here..."
            )

        # Chat Tab
        with gr.Tab("💬 Chat"):
            with gr.Row():
                with gr.Column(scale=4):
                    chatbot = gr.Chatbot(
                        label="Chat with your CSV",
                        height=400,
                        show_copy_button=True,
                    )
                    with gr.Row():
                        msg = gr.Textbox(
                            placeholder="Type your question about the data...",
                            show_label=False,
                            scale=8,
                        )
                        send_btn = gr.Button("➤", variant="primary", scale=1)
                    clear = gr.Button("🧹 Clear Chat")

        # Function Bindings
        initialize_button.click(
            csv_chatbot.initialize_agent,
            inputs=[file_input, api_key_input],
            outputs=init_output,
        )
        msg.submit(user, [msg, chatbot], [msg, chatbot], queue=False).then(
            bot, chatbot, chatbot
        )
        send_btn.click(user, [msg, chatbot], [msg, chatbot], queue=False).then(
            bot, chatbot, chatbot
        )
        clear.click(clear_chat, None, chatbot, queue=False)

    return demo