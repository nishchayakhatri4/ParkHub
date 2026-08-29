"""A simple command-line chatbot powered by Ollama."""
import ollama

MODEL = "qwen3:0.6b"

def ask_ollama(messages):
    """Send the conversation to Ollama and return the assistant's reply."""
    response = ollama.chat(model=MODEL, messages=messages)
    return response["message"]["content"]


def main():
    messages = [
        {"role": "system", "content": "You are a friendly and helpful assistant."}
    ]

    print(f"Chatting with {MODEL}. Type 'exit' or 'quit' to stop.\n")

    while True:
        try:
            user_text = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nGoodbye!")
            break

        if user_text.lower() in {"exit", "quit"}:
            print("Goodbye!")
            break
        if not user_text:
            continue

        messages.append({"role": "user", "content": user_text})

        try:
            reply = ask_ollama(messages)
        except ollama.ResponseError as error:
            print(f"Ollama error: {error}")
            print(f"Make sure the model is available by running: ollama pull {MODEL}")
            messages.pop()
            continue

        messages.append({"role": "assistant", "content": reply})
        print(f"Bot: {reply}\n")


if __name__ == "__main__":
    main()
