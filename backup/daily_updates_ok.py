import subprocess
import google.generativeai as genai
from datetime import datetime

# Thay YOUR_API_KEY bằng API key thực tế của bạn
GENAI_API_KEY = "AIzaSyCmUww234tHBNiU5VjKdtfgQBKNIW4w6Lk"
genai.configure(api_key=GENAI_API_KEY)

model = genai.GenerativeModel('gemini-1.5-flash')

def get_quotes_en(num_quotes=10):
    prompt = f"Generate {num_quotes} inspiring quotes about life, business, and happiness."
    response = model.generate_content(prompt)
    return [item.text for item in response.parts]

def get_tech_news_en(num_news=10):
    prompt = f"Summarize the top {num_news} most important technology news headlines of the day in English, with each summary being about 2-3 sentences long."
    response = model.generate_content(prompt)
    return [item.text for item in response.parts]

def translate_to_vietnamese(text):
    prompt = f"Translate the following text to Vietnamese: '{text}'"
    response = model.generate_content(prompt)
    return response.text

def format_for_notes(english_text, vietnamese_text):
    return f"{english_text}\n> *{vietnamese_text}*\n"

if __name__ == "__main__":
    today = datetime.now().strftime("%d/%m/%Y")
    quotes_en = get_quotes_en()
    news_en = get_tech_news_en()
    quotes_vi = [translate_to_vietnamese(quote) for quote in quotes_en]
    news_vi = [translate_to_vietnamese(news_item) for news_item in news_en]

    formatted_quotes = [format_for_notes(en, vi) for en, vi in zip(quotes_en, quotes_vi)]
    formatted_news = [format_for_notes(en, vi) for en, vi in zip(news_en, news_vi)]

    print(f"Date: {today}\n")
    print("--- Quotes ---")
    for i, formatted_quote in enumerate(formatted_quotes):
        print(f"{i+1}. {formatted_quote}")

    print("\n--- Technology News ---")
    for i, formatted_news_item in enumerate(formatted_news):
        print(f"{i+1}. {formatted_news_item}")

# Đường dẫn đến file AppleScript đã lưu
    applescript_path = "/Users/h2m/add_to_notes.applescript"

    # Kết hợp tất cả nội dung thành một chuỗi
    full_content = f"Date: {today}\n\n--- Quotes ---\n"
    for formatted_quote in formatted_quotes:
        full_content += f"{formatted_quote}\n"
    full_content += "\n--- Technology News ---\n"
    for formatted_news_item in formatted_news:
        full_content += f"{formatted_news_item}\n"

    # Gọi AppleScript để thêm nội dung vào Notes
    try:
        subprocess.run(['osascript', applescript_path, full_content], check=True)
        print("Đã thêm thông tin vào Apple Notes.")
    except subprocess.CalledProcessError as e:
        print(f"Lỗi khi gọi AppleScript: {e}")
    except FileNotFoundError:
        print(f"Không tìm thấy file AppleScript tại: {applescript_path}")