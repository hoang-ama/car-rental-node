import subprocess
import google.generativeai as genai
from datetime import datetime
import os

# Thay YOUR_API_KEY bằng API key thực tế của bạn
GENAI_API_KEY = "AIzaSyCmUww234tHBNiU5VjKdtfgQBKNIW4w6Lk"
genai.configure(api_key=GENAI_API_KEY)

model = genai.GenerativeModel('gemini-1.5-flash')

def get_quotes_en(num_quotes=10):
    prompt = f"Generate {num_quotes} inspiring quotes about life, business, and happiness."
    response = model.generate_content(prompt)
    return [item.text for item in response.parts]

def get_tech_news_en(num_news=10):
    prompt = f"Summarize {num_news} major trends and developments in the car-sharing, car-rental, self-driving car, electric vehicle, and new energy vehicle sectors. Include key information about automaker strategies and innovative transportation models."
    response = model.generate_content(prompt)
    return [item.text for item in response.parts]

def translate_to_vietnamese(text):
    prompt = f"Translate the following text to Vietnamese: '{text}'"
    response = model.generate_content(prompt)
    return response.text

# Updated formatting for Apple Notes with separate paragraphs for line breaks
def format_quote_for_notes(quote_number, english_text, vietnamese_text):
    category_en = "[Life]" if "life" in english_text.lower() else "[Business]" if "business" in english_text.lower() else "[Happiness]"
    category_vi = "[Cuộc sống]" if "life" in english_text.lower() else "[Kinh doanh]" if "business" in english_text.lower() else "[Hạnh phúc]"
    return f'<p>{quote_number}. {category_en} "{english_text}"</p><p><span style="color:green;"><i>{category_vi} "{vietnamese_text}"</i></span></p><p> </p>'

def format_news_for_notes(english_text, vietnamese_text):
    return f'<p>{english_text}</p><p><span style="color:green;"><i>{vietnamese_text}</i></span></p><p> </p>'

# Formatting for HTML file with CSS styling
def format_quote_for_html(quote_number, english_text, vietnamese_text):
    category_en = "[Life]" if "life" in english_text.lower() else "[Business]" if "business" in english_text.lower() else "[Happiness]"
    category_vi = "[Cuộc sống]" if "life" in english_text.lower() else "[Kinh doanh]" if "business" in english_text.lower() else "[Hạnh phúc]"
    return f'<li><strong>{quote_number}. {category_en}</strong> "{english_text}"<br><em style="color:green;">{category_vi} "{vietnamese_text}"</em></li>'

def format_news_for_html(english_text, vietnamese_text):
    return f'<li>{english_text}<br><em style="color:green;">{vietnamese_text}</em></li>'

    

if __name__ == "__main__":
    today = datetime.now().strftime("%d %b %Y %H:%M %Z")  # e.g., "19 May 2025 10:22 PM +07"
    quotes_en = get_quotes_en()
    news_en = get_tech_news_en()
    quotes_vi = [translate_to_vietnamese(quote) for quote in quotes_en]
    news_vi = [translate_to_vietnamese(news_item) for news_item in news_en]

    # Format content for Apple Notes
    formatted_quotes_notes = [format_quote_for_notes(i+1, en, vi) for i, (en, vi) in enumerate(zip(quotes_en, quotes_vi))]
    formatted_news_notes = [format_news_for_notes(en, vi) for en, vi in zip(news_en, news_vi)]
    full_content_notes = f'<h1>Date: {today}</h1><h2>Quotes</h2>'
    full_content_notes += ''.join(formatted_quotes_notes)
    full_content_notes += '<h2>Technology News</h2>'
    full_content_notes += ''.join(formatted_news_notes)
    full_content_notes += "\n**Note:** For the latest breaking news, please refer to sources like Reuters, Bloomberg, and Automotive News.\n"  # Added note

    # Format content for HTML file
    formatted_quotes_html = [format_quote_for_html(i+1, en, vi) for i, (en, vi) in enumerate(zip(quotes_en, quotes_vi))]
    formatted_news_html = [format_news_for_html(en, vi) for en, vi in zip(news_en, news_vi)]
    html_content = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Daily Updates - {today}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        h1 {{ color: #333; }}
        h2 {{ color: #555; }}
        li {{ margin-bottom: 15px; }}
        em {{ margin-left: 20px; }}
    </style>
</head>
<body>
    <h1>Date: {today}</h1>
    <h2>Quotes</h2>
    <ul>{''.join(formatted_quotes_html)}</ul>
    <h2>Technology News</h2>
    <ul>{''.join(formatted_news_html)}</ul>
    <p class="news-note">**Note:** To get the most up-to-date information, please check reliable sources such as Reuters, Bloomberg, and Automotive News.</p>
</body>
</html>'''

    # Đường dẫn đến file AppleScript đã lưu
    applescript_path = "/Users/h2m/Downloads/Code/Notes_automation/add_to_notes.applescript"

    # Update Apple Notes
    try:
        subprocess.run(['osascript', applescript_path, full_content_notes], check=True)
        print("Đã thêm thông tin vào Apple Notes.")
    except subprocess.CalledProcessError as e:
        print(f"Lỗi khi gọi AppleScript: {e}")
    except FileNotFoundError:
        print(f"Không tìm thấy file AppleScript tại: {applescript_path}")

    # Update or create HTML file
    script_dir = os.path.dirname(os.path.abspath(__file__))
    html_file_path = os.path.join(script_dir, "daily_updates.html")
    with open(html_file_path, 'w', encoding='utf-8') as html_file:
        html_file.write(html_content)
    print(f"Đã cập nhật hoặc tạo file {html_file_path}.")