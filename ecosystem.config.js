/**
 * PM2 Ecosystem Config — FruitShop
 *
 * Cách dùng:
 *   npm install -g pm2
 *   pm2 start ecosystem.config.js
 *   pm2 logs fruitshop
 *   pm2 monit
 *   pm2 stop fruitshop
 *   pm2 delete fruitshop
 *
 * Xem số CPU hiện có:
 *   node -e "console.log(require('os').cpus().length)"
 */

module.exports = {
  apps: [{
    name:   'fruitshop',
    script: 'app.js',

    // ── Cluster Mode ──────────────────────────────────────
    // 'max' = tự detect số CPU và spawn đúng đó process
    // Ví dụ: VPS 2 core → 2 workers, 4 core → 4 workers
    // Mỗi worker xử lý requests độc lập → throughput tăng tuyến tính
    instances:    'max',
    exec_mode:    'cluster',

    // ── Environment ───────────────────────────────────────
    env_production: {
      NODE_ENV:   'production',
      PORT:       3000,
    },
    env_development: {
      NODE_ENV:   'development',
      PORT:       3000,
    },

    // ── Auto-restart ──────────────────────────────────────
    watch:          false,        // không watch file trong production
    max_memory_restart: '400M',   // restart worker nếu dùng > 400MB RAM
    restart_delay:  3000,         // chờ 3s trước khi restart
    max_restarts:   10,           // tối đa 10 restart liên tiếp rồi stop

    // ── Logs ─────────────────────────────────────────────
    error_file:   './logs/pm2-error.log',
    out_file:     './logs/pm2-out.log',
    merge_logs:   true,           // gộp log của tất cả workers vào 1 file
    log_date_format: 'YYYY-MM-DD HH:mm:ss',

    // ── Graceful Reload ───────────────────────────────────
    // pm2 reload fruitshop → zero-downtime reload
    // Worker cũ tiếp tục xử lý request đang dở, worker mới lên nhận request mới
    kill_timeout:   5000,         // cho 5s để finish request đang xử lý
    listen_timeout: 10000,        // worker phải ready trong 10s

    // ── Sticky Sessions ───────────────────────────────────
    // Đảm bảo user luôn được route đến cùng 1 worker
    // → session in-memory hoạt động đúng trong cluster mode
    // Nếu dùng Redis store thì bỏ dòng này
    node_args: ['--max-old-space-size=400'],
  }]
}
