# FruitShop — Performance Optimization Notes

## Kết quả Artillery trước / sau (ước tính)

| Metric            | Trước     | Sau       |
|-------------------|-----------|-----------|
| Avg response time | ~380ms    | ~45ms     |
| DB queries/req    | 3–7       | 0–2       |
| Cache hit rate    | 0%        | ~80%      |
| Timeout errors    | nhiều     | gần 0     |

---

## 1. MongoDB Indexes

### Product
```
{ slug: 1 }                    → detail page lookup
{ isActive: 1, category: 1 }  → danh sách theo danh mục
{ isActive: 1, createdAt: -1 } → sort trang chủ
{ name: 'text', description: 'text' } → full-text search
```

### Order
```
{ status: 1, createdAt: -1 }  → admin list orders (hot)
{ status: 1, createdAt: 1  }  → date range filter
{ user: 1, createdAt: -1   }  → my-orders page
{ createdAt: -1            }  → dashboard aggregate
{ orderCode: 1             }  → tra cứu đơn hàng
```

### User
```
{ email: 1, role: 1 }  → admin login + countDocuments
{ role: 1           }  → dashboard countDocuments
```

### Category
```
{ slug: 1     }  → lookup by slug
{ isActive: 1 }  → filter active
```

---

## 2. In-Memory Cache (`middleware/cache.js`)

| Cache Key                  | TTL     | Invalidate khi           |
|----------------------------|---------|--------------------------|
| `categories:active`        | 5 phút  | add/edit/delete category |
| `products:featured`        | 1 phút  | add/edit/delete product  |
| `products:list:*`          | 30 giây | add/edit/delete product  |
| `product:detail:<slug>`    | 2 phút  | edit/delete product      |
| `admin:dashboard:stats`    | 1 phút  | confirm/ship order       |
| `admin:dashboard:monthly`  | 1 phút  | (same)                   |

---

## 3. Query Optimizations

### `.lean()` ở mọi read query
Trả về plain JS object thay vì Mongoose Document:
- Bỏ Mongoose overhead (getters, setters, virtuals)
- Giảm ~40% memory per document
- Tăng speed ~2-3x cho large result sets

### `.select()` — chỉ lấy field cần thiết
```js
// Trước
User.find().lean()  // lấy cả password, address...

// Sau
User.find().select('name email phone role isActive createdAt').lean()
```

### Bỏ double round-trip
```js
// Trước (2 queries)
const doc = await Order.findById(id)
await Order.findByIdAndUpdate(id, { status: 'confirmed' })

// Sau (1 query)
await Order.findOneAndUpdate(
  { _id: id, status: 'pending' },
  { status: 'confirmed', confirmedAt: new Date() }
)
```

### $text thay $regex
```js
// Trước — full collection scan, không dùng index
filter.name = { $regex: q, $options: 'i' }

// Sau — dùng text index, O(log n)
filter.$text = { $search: q }
```

### countDocuments thay findOne khi chỉ cần check tồn tại
```js
// Trước
const exists = await User.findOne({ email })  // load toàn bộ document

// Sau
const exists = await User.countDocuments({ email })  // chỉ đếm
```

### Promise.all — parallel thay sequential
```js
// Dashboard: 7 queries chạy song song thay vì tuần tự
const [q1, q2, q3, q4, q5, q6, q7] = await Promise.all([...])
```

---

## 4. Static Files Cache
```js
// public files cache 7 ngày trong production
app.use(express.static('public', { maxAge: '7d', etag: true }))
```

## 5. Pug View Cache
```js
// Templates compile 1 lần, cache trong RAM
if (process.env.NODE_ENV === 'production') app.enable('view cache')
```

---

## Chạy production
```bash
NODE_ENV=production npm start
```
