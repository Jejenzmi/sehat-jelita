import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '5s', target: 50 },  // simulate ramp-up of traffic from 1 to 50 users
    { duration: '10s', target: 50 }, // stay at 50 users for 10 seconds
    { duration: '5s', target: 0 },   // ramp-down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(99)<500'], // 99% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],    // http errors should be less than 1%
  },
};

export default function () {
  // Test hitting the health check endpoint which checks DB connectivity
  // using host.docker.internal to route from docker container to host machine
  const res = http.get('http://host.docker.internal:3000/health');
  
  check(res, {
    'is status 200': (r) => r.status === 200,
    'database connected': (r) => r.json('database.status') === 'connected',
  });
  
  sleep(1);
}
