#!/bin/bash

# ============================================
# SIMRS ZEN - Monitoring Setup Script
# Sets up PM2, Prometheus metrics, and logging
# ============================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

APP_NAME="simrs-zen"
LOG_DIR="/var/log/$APP_NAME"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   SIMRS ZEN Monitoring Setup${NC}"
echo -e "${GREEN}========================================${NC}"

# Install PM2 if not present
if ! command -v pm2 &> /dev/null; then
  echo -e "${YELLOW}Installing PM2...${NC}"
  npm install -g pm2
fi

# Install PM2 log rotation
echo -e "${YELLOW}Setting up PM2 log rotation...${NC}"
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 14
pm2 set pm2-logrotate:compress true

# Create PM2 ecosystem file
echo -e "${YELLOW}Creating PM2 ecosystem config...${NC}"
cat > /opt/$APP_NAME/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'simrs-zen',
    script: 'src/app.js',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/simrs-zen/error.log',
    out_file: '/var/log/simrs-zen/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    // Health check
    listen_timeout: 10000,
    kill_timeout: 5000,
    wait_ready: true,
    // Metrics for PM2 Plus
    pmx: true
  }]
};
EOF

# Setup systemd service for PM2
echo -e "${YELLOW}Setting up PM2 startup...${NC}"
pm2 startup systemd -u root --hp /root
pm2 save

# Create health check script
echo -e "${YELLOW}Creating health check script...${NC}"
cat > /opt/$APP_NAME/scripts/health-check.sh << 'EOF'
#!/bin/bash

HEALTH_URL="http://localhost:3000/health"
MAX_RETRIES=3
RETRY_DELAY=5

for i in $(seq 1 $MAX_RETRIES); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL 2>/dev/null)
  
  if [ "$STATUS" == "200" ]; then
    echo "OK: Health check passed"
    exit 0
  fi
  
  echo "WARN: Health check failed (attempt $i/$MAX_RETRIES)"
  sleep $RETRY_DELAY
done

echo "CRITICAL: Health check failed after $MAX_RETRIES attempts"
exit 1
EOF
chmod +x /opt/$APP_NAME/scripts/health-check.sh

# Create metrics endpoint
echo -e "${YELLOW}Creating metrics collection...${NC}"
cat > /opt/$APP_NAME/src/routes/metrics.routes.js << 'EOF'
import { Router } from 'express';
import { prisma } from '../config/database.js';
import os from 'os';

const router = Router();

/**
 * GET /metrics
 * Prometheus-compatible metrics endpoint
 */
router.get('/', async (req, res) => {
  try {
    const [patientCount, visitsTodayCount, memUsage] = await Promise.all([
      prisma.patients.count(),
      prisma.visits.count({
        where: {
          visit_date: new Date().toISOString().split('T')[0]
        }
      }),
      process.memoryUsage()
    ]);

    const metrics = `
# HELP simrs_patients_total Total number of registered patients
# TYPE simrs_patients_total gauge
simrs_patients_total ${patientCount}

# HELP simrs_visits_today Total visits today
# TYPE simrs_visits_today gauge
simrs_visits_today ${visitsTodayCount}

# HELP nodejs_memory_heap_used_bytes Node.js heap memory used
# TYPE nodejs_memory_heap_used_bytes gauge
nodejs_memory_heap_used_bytes ${memUsage.heapUsed}

# HELP nodejs_memory_heap_total_bytes Node.js total heap memory
# TYPE nodejs_memory_heap_total_bytes gauge
nodejs_memory_heap_total_bytes ${memUsage.heapTotal}

# HELP system_cpu_load System CPU load average (1 min)
# TYPE system_cpu_load gauge
system_cpu_load ${os.loadavg()[0]}

# HELP system_memory_free_bytes System free memory
# TYPE system_memory_free_bytes gauge
system_memory_free_bytes ${os.freemem()}
`;

    res.set('Content-Type', 'text/plain');
    res.send(metrics.trim());
  } catch (error) {
    res.status(500).send('# Error collecting metrics');
  }
});

export default router;
EOF

# Setup cron for health checks
echo -e "${YELLOW}Setting up cron jobs...${NC}"
(crontab -l 2>/dev/null || true; echo "*/5 * * * * /opt/$APP_NAME/scripts/health-check.sh >> /var/log/$APP_NAME/health-check.log 2>&1") | crontab -
(crontab -l 2>/dev/null || true; echo "0 2 * * * /opt/$APP_NAME/scripts/backup-db.sh >> /var/log/$APP_NAME/backup.log 2>&1") | crontab -

# Create log directories
mkdir -p $LOG_DIR
touch $LOG_DIR/health-check.log
touch $LOG_DIR/backup.log

# Setup logrotate for custom logs
echo -e "${YELLOW}Setting up logrotate...${NC}"
cat > /etc/logrotate.d/$APP_NAME << EOF
$LOG_DIR/*.log {
  daily
  rotate 14
  compress
  delaycompress
  missingok
  notifempty
  create 0644 root root
}
EOF

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Monitoring setup completed!${NC}"
echo -e "${GREEN}========================================${NC}"

echo ""
echo "Commands:"
echo "  pm2 status          - View application status"
echo "  pm2 logs            - View logs"
echo "  pm2 monit           - Interactive monitoring"
echo "  curl localhost:3000/metrics - View Prometheus metrics"
echo ""
