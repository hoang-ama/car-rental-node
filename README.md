Automate daily news by script

Yêu cầu: 
Sử dụng kịch bản tự động (script) trong macbook để làm việc như sau:
- Tìm 10 câu quotes hay về cuộc sống, kinh doanh, hạnh phúc
- Tóm tắt 10 tin tức nổi bật về công nghệ trong ngày
Tự động hàng ngày lúc 9h sáng gửi vào một file note duy nhất (ví dụ tên là Daily updates) của ứng dụng Apple Notes cũng như tạo file html, sử dụng các tool có sẵn của MacOS và các ứng dụng AI (như Gemeni, Grok hoặc PerPlexity, ưu tiên dùng Gemeni bằng tài khoản này) để tạo nên kịch bản tự động này  

Triển khai:

I> Task 1: Tạo kịch bản để lấy thông tin cập nhật từ ChatGPT (Gemini) và đưa vào Apple Notes và file html 

Bước 1: Tạo kịch bản với Python (file: daily_updates.py) 
1. Lấy API key của Gemini
2. Tạo Prompt: 
“Summarize the top 10 most important technology news headlines of today in English, with each summary being about 2-3 sentences long.”
or 
“Give me the 10 news items related to technology and startups, with a strong emphasis on the car-sharing, car-rental, self-driving car, electric vehicle, and new energy vehicle sectors. Also include news from automakers and updates on innovative transportation models launched globally."

Syntax: prompt = f"Give me the {num_news} news items related to technology and startups, with a strong emphasis on the car-sharing, car-rental, self-driving car, electric vehicle, and new energy vehicle sectors. Also include news from automakers and updates on innovative transportation models launched globally."
3. Tạo và cập nhật nôi dung cho file: daily_updates.py
Tạo script Python bằng lệnh: # nano ~/daily_updates.py
Bước 2: Tạo AppleScript để update thông tin vào Apple Notes (file: add_to_notes.applescript)

______--------_______

II> Task 2: Tự động chạy kịch bản daily_updates.py vào 8h sáng hàng ngày trên Mac, ngay cả khi laptop không bật, bạn có thể sử dụng công cụ launchd (hệ thống khởi chạy mặc định của macOS). launchd cho phép lên lịch các tác vụ và có thể đánh thức máy để thực thi chúng. Dưới đây là hướng dẫn từng bước:

Điều kiện
* Máy Mac của bạn cần được cấu hình để cho phép đánh thức từ chế độ ngủ (sleep) hoặc khởi động lại khi cần.
* Đảm bảo laptop được kết nối với nguồn điện để tránh gián đoạn.
* Kịch bản Python (daily_updates.py) và AppleScript (add_to_notes.applescript) đã được đặt trong cùng thư mục (ví dụ: /Users/h2m/Downloads/Code/Notes_automation/).

Bước 1: Tạo file PLIST cho launchd
Launchd sử dụng các file cấu hình định dạng PLIST (Property List) để định nghĩa tác vụ. Bạn cần tạo một file PLIST để lên lịch chạy kịch bản.
    * Mở TextEdit hoặc bất kỳ trình soạn thảo văn bản nào.
    * Lưu file với tên com.user.dailyupdates.plist vào thư mục /Users/h2m/Library/LaunchAgents/
    * Hoăc: Vào thư mục: mkdir -p ~/Library/LaunchAgentsTạo file: nano ~/Library/LaunchAgents/com.user.dailyupdate.plist

    Bước 2: Cấp quyền và load vào launch
1. Câp quyền và load vào launch cho file: com.user.dailyupdate.plist
# chmod 644 /Users/h2m/Library/LaunchAgents/com.user.dailyupdates.plist
Load vào launchd:# launchctl load /Users/h2m/Library/LaunchAgents/com.user.dailyupdate.plist
Kiểm tra tác vụ có được kích hoạt: # launchctl list | grep com.user.dailyupdates

2. Câp quyền và chạy daily_updates.pyCấp quyền: 
chmod +x /Users/h2m/Downloads/Code/Notes_automation/daily_updates.py
chmod +x /Users/h2m/Downloads/Code/Notes_automation/add_to_notes.applescript
Kiểm tra và chạy thử: python3 /Users/h2m/Downloads/Code/Notes_automation/daily_updates.py
	Cập nhật hoặc xóa tác vụ:
Để cập nhật file PLIST, chạy lệnh unload trước:# launchctl unload /Users/h2m/Library/LaunchAgents/com.user.dailyupdates.plist 
sau đó chạy lệnh load ở trên 
Để xóa tác vụ, chạy lệnh: # launchctl unload ~/Library/LaunchAgents/com.user.dailyupdates.plist 
và xóa file PLIST.

Bước 3: Cấu hình máy Mac để đánh thức khi cần
1. Mở System Settings > Energy Saver (hoặc Battery tùy phiên bản macOS).
2. Đảm bảo tùy chọn Wake for network access hoặc Enable Power Nap được bật.
3. Để đảm bảo máy tự khởi động khi tắt nguồn, bạn cần dùng lệnh pmset trong Terminal:
Chạy lệnh sau để đặt lịch khởi động lúc 7:55 sáng (trước 8:00 để chuẩn bị): # sudo pmset repeat wake MTWRF 07:55:00
Nhập mật khẩu quản trị viên khi được yêu cầu.
Kiểm tra lịch trình bằng:# pmset -g
P/s: Nếu gặp lỗi, kiểm tra log bằng syslog hoặc console với từ khóa com.user.dailyupdates.