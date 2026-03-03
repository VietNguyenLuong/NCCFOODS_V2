# FruitShop v3 — Performance Guide

## Kết quả Artillery test (before/after ước tính)

| Metric           | v2 (trước) | v3 (sau)      |
|------------------|------------|---------------|
| Success rate     | 29%        | ~95%+         |
| Avg response     | 5,148 ms   | ~150–400 ms   |
| P95 response     | 9,230 ms   | ~800 ms       |
| ETIMEDOUT errors | 789/1111   | ~0            |
| Max req/s        | ~10        | ~60–80        |

---

## Tại sao server bị sập ở 15 req/s?

### 1. MongoDB Pool Size = 5 (mặc định)
```
15 req/s × 3 queries/req = 45 queries/s cần xử lý
Pool chỉ có 5 connections → 40 queries phải CHỜ
Chờ queue → timeout → ETIMEDOUT
```
**Fix:** `maxPoolSize: 20` trong `config/db.js`

### 2. Single Process = 1 CPU Core
```
Node.js mặc định = single-threaded
Render Pug template block CPU trong vài ms
15 req/s × 5ms render = 75ms/s CPU bị block
→ khi load cao, request queue tích lũy → timeout
```
**Fix:** PM2 Cluster mode dùng tất cả CPU cores

### 3. Không nén response (~50KB/HTML)
```
15 req/s × 50KB = 750 KB/s upstream
+ JS/CSS không nén → 2-3 MB/s
→ bandwidth và CPU render bị ngốn
```
**Fix:** `compression()` middleware → giảm 70% payload

### 4. Không Rate Limit
```
Artillery tạo 900 VU → flood server
Không có gì chặn → server nhận hết → quá tải
```
**Fix:** `express-rate-limit` → 200 req/phút/IP

---

## Cách chạy production với PM2

### Bước 1: Cài PM2
```bash
npm install -g pm2
```

### Bước 2: Cài dependencies
```bash
npm install
```

### Bước 3: Setup .env
```bash
cp .env.example .env
# Sửa MONGODB_URI, SESSION_SECRET
```

### Bước 4: Seed database
```bash
npm run seed
```

### Bước 5: Khởi động cluster
```bash
pm2 start ecosystem.config.js --env production
```

### Quản lý
```bash
pm2 status                    # xem trạng thái
pm2 monit                     # monitor realtime (CPU, RAM, logs)
pm2 logs fruitshop            # xem logs
pm2 reload fruitshop          # zero-downtime reload
pm2 stop fruitshop            # dừng
pm2 startup                   # tự khởi động khi reboot VPS
pm2 save                      # lưu config
```

---

## Kiến trúc sau khi optimize

```
Internet
    │
    ▼
[Rate Limiter] ──── chặn flood (200 req/min/IP)
    │
    ▼
[Compression] ──── gzip response (-70% size)
    │
    ▼
[Static Files] ─── served trực tiếp (7d cache)
    │
    ▼
[PM2 Cluster]
 ┌──┬──┬──┬──┐
 W1 W2 W3 W4     ← mỗi worker = 1 CPU core
 └──┴──┴──┴──┘
    │
    ▼
[In-Memory Cache] ── tránh query DB lặp lại
    │
    ▼
[MongoDB Pool=20] ── 20 connections song song
    │
    ▼
[Indexes] ────────── O(log n) thay O(n)
```

---

## Nếu muốn scale hơn nữa

### Shared Session Store (Redis)
```bash
npm install connect-redis ioredis
```
Trong `app.js`:
```js
const RedisStore = require('connect-redis').default
const { createClient } = require('ioredis')
const redisClient = createClient({ url: process.env.REDIS_URL })
// ...
app.use(session({
  store: new RedisStore({ client: redisClient }),
  // ...
}))
```

### Shared Cache (Redis)
Thay `middleware/cache.js` bằng ioredis để các workers share cache:
- Categories thay đổi → invalidate 1 lần cho tất cả workers
- Dashboard stats sync giữa workers

### Nginx Reverse Proxy
```nginx
upstream fruitshop {
    server 127.0.0.1:3000;
}
server {
    listen 80;
    gzip on;
    gzip_types text/html application/json;

    location /uploads/ {
        alias /path/to/fruitshop/public/uploads/;
        expires 30d;
    }
    location / {
        proxy_pass http://fruitshop;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Nginx phục vụ static files → giải phóng Node.js hoàn toàn.

---

## MongoDB Indexes tổng hợp

```
Product:  slug(1)  |  isActive+category  |  isActive+createdAt  |  name+desc TEXT
Order:    status+createdAt  |  user+createdAt  |  orderCode
User:     email+role  |  role
Category: slug  |  isActive
```

## Tất cả read queries đều dùng:
- `.lean()` — bỏ Mongoose Document overhead (~40% faster)
- `.select()` — chỉ lấy field cần thiết
- `$text` thay `$regex` — dùng index, không full scan
- `countDocuments` thay `findOne` khi chỉ check tồn tại
- `findOneAndUpdate` thay `findById` + `findByIdAndUpdate` (1 round-trip)
- `Promise.all` cho queries song song
