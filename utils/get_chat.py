import io
import base64
import matplotlib.pyplot as plt

def chat(agent, message):
    if agent is None:
        return "Please initialize the agent first by uploading a CSV file and providing an API key."

    try:
        CSV_PROMPT_PREFIX = "First get the column names from the CSV file, then answer the question."
        CSV_PROMPT_SUFFIX = """
        - **ALWAYS** before giving the Final Answer, try another method.
        Then reflect on the answers of the two methods you did and ask yourself
        if it answers correctly the original question.
        If you are not sure, try another method.
        - If the methods tried do not give the same result, reflect and
        try again until you have two methods that have the same result.
        - If you still cannot arrive to a consistent result, say that
        you are not sure of the answer.
        - If you are sure of the correct answer, create a beautiful
        and thorough response using Markdown.
        - **DO NOT MAKE UP AN ANSWER OR USE PRIOR KNOWLEDGE,
        ONLY USE THE RESULTS OF THE CALCULATIONS YOU HAVE DONE**.
        - **ALWAYS**, as part of your "Final Answer", explain how you got
        to the answer on a section that starts with: "\n\nExplanation:\n".
        In the explanation, mention the column names that you used to get
        to the final answer.
        """
        result = agent.run(CSV_PROMPT_PREFIX + message + CSV_PROMPT_SUFFIX)

        fig = plt.gcf()
        if fig.get_axes():
            buf = io.BytesIO()
            fig.savefig(buf, format='png')
            buf.seek(0)
            img_str = base64.b64encode(buf.getvalue()).decode()
            img_markdown = f"![plot](data:image/png;base64,{img_str})"
            plt.clf()
            plt.close(fig)
            return result + "\n\n" + img_markdown
        else:
            return result
    except Exception as e:
        return f"An error occurred: {str(e)}"