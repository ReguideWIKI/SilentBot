## Yêu cầu
1. Ref: https://ceremony.silentprotocol.org?ref=28952297
1. Đăng ký **[Silent Protocol ](https://ceremony.silentprotocol.org?ref=28952297)**
3. **Token** của **Silent Protocol**

### Token Silent
1. Trên trang **Slient Protocol** đang hàng đợi nhấn **Ctrl + Shift + I** hoặc **F12** nếu dùng **Windows** và **Crtl + Shift + J** nếu dùng **macOS**
2. Truy cập vào thẻ **Console**
3. Gõ `localStorage.getItem('silent_jwt');`
4. Copy toàn bộ giá trị `eyJhbGciOi.............` nhớ xóa hai dấu ` `` ` ở hai đầu

---

## File token.txt
```
eyJhbGciOi.............
eyJhbGciOi.............
eyJhbGciOi.............
eyJhbGciOi.............
```

---
## File proxy.txt (KHÔNG DÙNG BỎ TRỐNG, PROXY DIE DÙNG LOCAL)
```
103.xx.xx.xx:60000:user:pass
103.xx.xx.xx:60000:user:pass
103.xx.xx.xx:60000:user:pass
103.xx.xx.xx:60000:user:pass
```

--- 
### Clone bot

   ```bash
   git clone https://github.com/ReguideWIKI/SilentBot.git
   cd SilentBot
   ```
---


### Cấu Hình Token và Proxy

1. Mở lần lượt từng file `token.txt` và `proxy.txt`
   ```bash
   nano token.txt
   ```
   ```bash
   nano proxy.txt
   ```
2. Điền theo cấu trúc dữ liệu phía trên
3. Lưu file bằng tổ hợp phím **Ctrl + S**, sau đó thoát bằng **Ctrl + X**
---

### Chạy Ứng Dụng

1. Run **Terminal**:
   ```bash
   docker compose up --build -d
   ```
---

### Để chạy và canh thời gian mở lại phiên trên chrome và thực hiện contribute

Để quay lại phiên `screen` đã tạo, bạn chỉ cần chạy lệnh:

```bash
docker compose logs -f
```
