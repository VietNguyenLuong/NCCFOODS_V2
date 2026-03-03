# 🍊 FruitShop — Node.js + Pug + MongoDB

Website ban hoa qua hien dai voi AI tu van dinh duong.

## Cai dat

```bash
npm install
cp .env.example .env
# Chinh sua .env voi MongoDB URI va API key
npm run seed   # Tao du lieu mau
npm run dev    # Chay dev server
```

## Tai khoan mac dinh

- **Admin:** admin@fruitshop.vn / Admin@123
- **URL Admin:** http://localhost:3000/admin/login

## Cau truc

```
fruitshop/
├── models/          # Mongoose schemas (User, Category, Product, Order)
├── controllers/     # Xu ly logic (auth, product, order, admin)
├── routes/          # Express routes (auth, shop, orders, admin, ai)
├── middleware/      # Auth middleware
├── views/           # Pug templates
│   ├── pages/       # Trang chinh (home, products, cart, login...)
│   ├── partials/    # Navbar, footer, product-card mixin
│   └── admin/       # Toan bo trang quan tri
├── public/css/      # style.css (frontend) + admin.css (admin)
├── public/js/       # main.js + admin.js
├── data/seed.js     # Script tao du lieu mau
└── app.js           # Entry point
```

## Tinh nang

### Frontend
- Dang ky / dang nhap nguoi dung
- Xem san pham, loc theo danh muc
- Gio hang (localStorage)
- Checkout voi form nhap thong tin + upload bill
- AI goi y hoa qua theo tam trang (Anthropic API)
- FruitBot chatbot tu van dinh duong

### Admin Panel (/admin)
- Thong ke: so khach, don trong thang, doanh thu, bieu do
- Quan ly tai khoan: them/sua/xoa
- Quan ly danh muc: them/sua/xoa
- Don hang cho xac nhan: xem bill, xac nhan
- Don hang da xac nhan: dong hang, huy
- Don hang da gui: xem, khoi phuc
- Xem chi tiet don hang
