THỐNG KÊ WEBSITE NHN — KẾT NỐI DỮ LIỆU THẬT (GitHub Pages)

Tình trạng file tải: Dashboard thống kê đã được tích hợp vào thong-ke.html của web chính. Ở trạng thái mặc định, các con số là dấu — (chưa kết nối). KHÔNG CÓ số liệu giả hiển thị cho người xem.

GitHub Pages là hosting tĩnh nên không có database để đếm lượt truy cập. Gói này có sẵn một Cloudflare Worker + D1 để nhận sự kiện pageview và trả dữ liệu thống kê. Bạn cần tài khoản Cloudflare và triển khai backend một lần. Không thể hoạt động chỉ bằng upload HTML lên GitHub.

CÁCH TRIỂN KHAI (máy có Node.js):
1. Đăng nhập Cloudflare: npx wrangler login
2. Tạo D1: npx wrangler d1 create nhn-site-analytics-db
3. Đổi tên wrangler.toml.example thành wrangler.toml; điền database_id do bước 2 trả về.
4. Đặt ALLOWED_ORIGINS thành nguồn gốc URL GitHub Pages của bạn, ví dụ https://nguyenhuunhon12305.github.io (KHÔNG thêm tên repository ở cuối). Nếu bạn dùng tên miền riêng, thêm nó vào danh sách ngăn cách bằng dấu phẩy.
5. Tạo bảng: npx wrangler d1 execute nhn-site-analytics-db --remote --file=./schema.sql
6. Cài secret SALT: npx wrangler secret put ANALYTICS_SALT
   Nhập một chuỗi ngẫu nhiên dài và bí mật. Không ghi secret vào các file HTML/JS công khai.
7. Triển khai: npx wrangler deploy
8. Copy URL worker dạng https://nhn-site-analytics....workers.dev vào apiBase trong analytics-config.js. Lưu file và cập nhật các file website lên GitHub.
9. Mở URL GitHub Pages và kiểm tra thong-ke.html. Lần triển khai mới bắt đầu ghi lượt xem; không thể hồi tố lượt xem trước đó.

TÙY CHỌN: THỐNG KÊ TÀI KHOẢN GOOGLE RIÊNG
- Cần tự tạo OAuth Client ID (ứng dụng web) trong Google Cloud Console, thêm origin trang GitHub Pages vào Authorized JavaScript origins.
- Đặt GOOGLE_CLIENT_ID vào [vars] trong wrangler.toml; cũng đặt giá trị này vào analytics-config.js: googleClientId.
- Triển khai lại Worker, upload lại file config.
- Trang Thống kê sẽ hiện nút Google Sign-In nhỏ bên dưới số tài khoản. Chỉ người tự nguyện đăng nhập trên trang đó được tính vào chỉ số tài khoản; không tự đọc Gmail của khách truy cập.
- Worker xác minh ID token với Google, chỉ lưu giá trị hash của Google subject; không lưu họ tên, địa chỉ Gmail hoặc IP trong database này. Việc xác minh bằng tokeninfo phù hợp hệ thống cá nhân lưu lượng thấp; ứng dụng nhiều người dùng nên xác minh JWT bằng public keys của Google và có thêm chống lạm dụng.

CÁCH ĐẾM
- Pageviews = số lần các trang được tải sau khi backend được kết nối.
- Khách riêng = số định danh trình duyệt tạo ngẫu nhiên lưu trong localStorage. Không phải số người chính xác; xóa dữ liệu trình duyệt / dùng trình duyệt khác có thể tạo thêm một ID.
- Tài khoản Google riêng = số Google sub đã xác minh khác nhau trong kỳ, chỉ khi người dùng tự đăng nhập. KHÔNG cộng nó với số khách riêng.
- Nút 7 ngày/30 ngày hiển thị số liệu trong khoảng ngày theo múi giờ Việt Nam UTC+7.
- Dashboard mặc định là công khai; ai cũng xem được số liệu tổng hợp. Nếu bạn muốn chỉ chủ website xem được, cần thêm xác thực cho endpoint summary và trang dashboard.
- Endpoint ghi lượt xem có thể bị bot gọi giả; giải pháp cá nhân này không phải anti-fraud analytics.

RIÊNG TƯ
- Khi triển khai thật, nên công khai một thông báo ngắn về việc dùng localStorage để ghi số liệu truy cập, phù hợp quy định về dữ liệu cá nhân và quyền riêng tư áp dụng.
- Không tải/đưa mật khẩu, secret, account token hay DB credentials lên repository công khai.
