/**
 * PM2 Ecosystem — FruitShop
 * Tối ưu cho VPS 2 core / 2GB RAM, mục tiêu 500 user online
 *
 * Lệnh:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 reload fruitshop        ← zero-downtime reload
 *   pm2 monit                   ← xem CPU/RAM realtime
 */
module.exports = {
  apps: [{
    name:      'fruitshop',
    script:    'app.js',

    // ── Cluster: 2 workers = 2 cores ─────────────────────
    instances:    2,         // hardcode 2 thay vì 'max' — chắc chắn hơn
    exec_mode:    'cluster',

    // ── Environment ───────────────────────────────────────
    env_production: {
      NODE_ENV:         'production',
      PORT:             3000,
      MONGO_POOL_SIZE:  15,   // 2 workers × 15 = 30 total connections
    },

    // ── Memory guard — VPS không có swap! ─────────────────
    // Worker dùng > 350MB → restart ngay tránh OOM kill cả server
    max_memory_restart: '350M',

    // ── Node.js heap limit ────────────────────────────────
    // RAM: 2GB total, 2 workers → mỗi worker tối đa ~350MB heap
    node_args: '--max-old-space-size=350',

    // ── Stability ─────────────────────────────────────────
    watch:          false,
    restart_delay:  2000,    // 2s trước khi restart
    max_restarts:   5,       // 5 lần liên tiếp → stop (báo lỗi nghiêm trọng)
    min_uptime:     '10s',   // phải chạy 10s mới tính là stable restart

    // ── Logs ──────────────────────────────────────────────
    error_file:      './logs/pm2-error.log',
    out_file:        './logs/pm2-out.log',
    merge_logs:      true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss',

    // ── Graceful shutdown ─────────────────────────────────
    kill_timeout:    5000,   // 5s để finish request đang xử lý
    listen_timeout:  8000,
  }]
}
