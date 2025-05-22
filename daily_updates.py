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

# Formatting for Apple Notes (giữ nguyên)
def format_quote_for_notes(quote_number, english_text, vietnamese_text):
    category_en = "[Life]" if "life" in english_text.lower() else "[Business]" if "business" in english_text.lower() else "[Happiness]"
    category_vi = "[Cuộc sống]" if "life" in english_text.lower() else "[Kinh doanh]" if "business" in english_text.lower() else "[Hạnh phúc]"
    return f'<p>{quote_number}. {category_en} "{english_text}"</p><p><span style="color:green;"><i>{category_vi} "{vietnamese_text}"</i></span></p><p> </p>'

def format_news_for_notes(english_text, vietnamese_text):
    return f'<p>{english_text}</p><p><span style="color:green;"><i>{vietnamese_text}</i></span></p><p> </p>'

# Formatting for HTML file (cập nhật để thêm số thứ tự cho news)
def format_quote_for_html(quote_number, english_text, vietnamese_text):
    category_en = "[Life]" if "life" in english_text.lower() else "[Business]" if "business" in english_text.lower() else "[Happiness]"
    category_vi = "[Cuộc sống]" if "life" in english_text.lower() else "[Kinh doanh]" if "business" in english_text.lower() else "[Hạnh phúc]"
    return f'<li><strong>{quote_number}. {category_en}</strong> "{english_text}"<br><em style="color:green;">{category_vi} "{vietnamese_text}"</em></li>'

def format_news_for_html(news_number, english_text, vietnamese_text):
    return f'<li><strong>{news_number}.</strong> {english_text}<br><em style="color:green;">{vietnamese_text}</em></li>'

# Function để cập nhật Apple Notes (giữ nguyên)
def update_apple_notes(content):
    applescript_path = "/Users/h2m/Downloads/Code/Notes_automation/add_to_notes.applescript"
    try:
        subprocess.run(['osascript', applescript_path, content], check=True)
        print("Đã thêm thông tin vào Apple Notes.")
    except subprocess.CalledProcessError as e:
        print(f"Lỗi khi gọi AppleScript: {e}")
    except FileNotFoundError:
        print(f"Không tìm thấy file AppleScript tại: {applescript_path}")

# Function để cập nhật HTML file (mới thêm và cập nhật logic append)
def update_html_file(new_daily_html):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    html_file_path = os.path.join(script_dir, "daily_updates.html")
    if os.path.exists(html_file_path):
        with open(html_file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        # Thêm nội dung mới trước thẻ </body>
        updated_content = content.replace('</body>', new_daily_html + '</body>', 1)
    else:
        # Tạo file HTML mới với cấu trúc đầy đủ nếu chưa tồn tại
        updated_content = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Daily Updates</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        h1 {{ color: #333; }}
        h2 {{ color: #555; }}
        li {{ margin-bottom: 15px; }}
        em {{ margin-left: 20px; }}
        .daily-update {{ margin-bottom: 30px; }}
    </style>
</head>
<body>
{new_daily_html}
</body>
</html>'''
    with open(html_file_path, 'w', encoding='utf-8') as f:
        f.write(updated_content)
    print(f"Đã cập nhật file {html_file_path}.")

if __name__ == "__main__":
    today = datetime.now().strftime("%d %b %Y %H:%M %Z")  # e.g., "19 May 2025 10:22 PM +07"
    quotes_en = get_quotes_en()
    news_en = get_tech_news_en()
    quotes_vi = [translate_to_vietnamese(quote) for quote in quotes_en]
    news_vi = [translate_to_vietnamese(news_item) for news_item in news_en]

    # Format content cho Apple Notes (giữ nguyên)
    formatted_quotes_notes = [format_quote_for_notes(i+1, en, vi) for i, (en, vi) in enumerate(zip(quotes_en, quotes_vi))]
    formatted_news_notes = [format_news_for_notes(en, vi) for en, vi in zip(news_en, news_vi)]
    full_content_notes = f'<h1>Date: {today}</h1><h2>Quotes</h2>'
    full_content_notes += ''.join(formatted_quotes_notes)
    full_content_notes += '<h2>Technology News</h2>'
    full_content_notes += ''.join(formatted_news_notes)
    full_content_notes += "\n**Note:** For the latest breaking news, please refer to sources like Reuters, Bloomberg, and Automotive News.\n"

    # Format content cho HTML file (cập nhật để tạo khối daily-update)
    new_daily_html = f'''
<div class="daily-update">
    <h1>Date: {today}</h1>
    <h2>Quotes</h2>
    <ul>
        {''.join([format_quote_for_html(i+1, en, vi) for i, (en, vi) in enumerate(zip(quotes_en, quotes_vi))])}
    </ul>
    <h2>Technology News</h2>
    <ul>
        {''.join([format_news_for_html(i+1, en, vi) for i, (en, vi) in enumerate(zip(news_en, news_vi))])}
    </ul>
    <p class="news-note">**Note:** To get the most up-to-date information, please check reliable sources such as Reuters, Bloomberg, and Automotive News.</p>
</div>
'''

    # Cập nhật Apple Notes và HTML file
    update_apple_notes(full_content_notes)
    update_html_file(new_daily_html)