const Product  = require('../models/Product')
const Category = require('../models/Category')
let homeCache = null
let cacheTime = 0
exports.getHome = async (req, res) => {
  // try {
  //   const [featured, categories] = await Promise.all([
  //     Product.find({ isActive: 1, isFeatured: 1 }).populate('category').limit(20).lean(),
  //     Category.find({ isActive: 1 })
  //   ])
  //   const moods = [
  //     { emoji: '⚡', label: 'Nang luong'   },
  //     { emoji: '😴', label: 'Met moi'      },
  //     { emoji: '😰', label: 'Cang thang'   },
  //     { emoji: '🤒', label: 'Om nhe'       },
  //     { emoji: '💪', label: 'Tap the thao' }
  //   ]
  //   const marqueeItems = [
  //     '🍇 Nho Shine Muscat', '🥭 Xoai Hoa Loc', '🍓 Dau Da Lat', '🫐 Viet quat My',
  //     '🍑 Dao Han Quoc', '🍊 Cam Valencia', '🥝 Kiwi SunGold', '🍒 Cherry My',
  //     '🍇 Nho Shine Muscat', '🥭 Xoai Hoa Loc', '🍓 Dau Da Lat', '🫐 Viet quat My',
  //     '🍑 Dao Han Quoc', '🍊 Cam Valencia', '🥝 Kiwi SunGold', '🍒 Cherry My'
  //   ]
  //   const whyItems = [
  //     { icon: '🌱', title: '100% Tu nhien', desc: 'Khong hoa chat, khong pham mau. Tuoi thang tu vuon.' },
  //     { icon: '🚀', title: 'Giao trong 24h', desc: 'Dat truoc 20h, nhan hang sang hom sau. Dong goi lanh.' },
  //     { icon: '💯', title: 'Hoan tien neu hong', desc: 'Khong hai long? Hoan 100% trong 24h, khong hoi them.' },
  //     { icon: '🌍', title: 'Nguon goc ro rang', desc: 'Moi san pham co ma tra cuu xuat xu chinh xac.' }
  //   ]
  //   const testimonials = [
  //     { stars: '★★★★★', text: 'Nho Shine Muscat ngot khong tuong, vo mong an ca hat. Tuan nao cung order!', name: 'Nguyen Thi Ha',  loc: 'Ha Noi', avatar: '👩' },
  //     { stars: '★★★★★', text: 'Giao sieu nhanh, dong goi can than. Mua cho ca gia dinh hang tuan, rat hai long.', name: 'Tran Minh Khoi', loc: 'TP.HCM', avatar: '👨' },
  //     { stars: '★★★★☆', text: 'Dau tay Da Lat tuoi rat ngon. Combo tong hop rat dang tien.', name: 'Le Thu Trang', loc: 'Da Nang', avatar: '👩' }
  //   ]
  //   res.render('pages/home', { title: 'NCCFOODS - Hoa quả tươi ngon', featured, categories, moods, marqueeItems, whyItems, testimonials })
  // } catch (err) {
  //   console.error(err)
  //   res.render('pages/home', { title: 'NCCFOODS', featured: [], categories: [], moods: [], marqueeItems: [], whyItems: [], testimonials: [] })
  // }
  try {

    // cache 30s
    if (homeCache && Date.now() - cacheTime < 30000) {
      return res.render('pages/home', homeCache)
    }

    const [featured, categories] = await Promise.all([
      Product.find({ isActive: 1, isFeatured: 1 })
        .populate('category')
        .limit(20)
        .lean(),
      Category.find({ isActive: 1 }).lean()
    ])

    const data = {
      title: 'NCCFOODS - Hoa quả tươi ngon',
      featured,
      categories
    }

    homeCache = data
    cacheTime = Date.now()

    res.render('pages/home', data)

  } catch (err) {
    console.error(err)
    res.render('pages/home', { featured: [], categories: [] })
  }
}
