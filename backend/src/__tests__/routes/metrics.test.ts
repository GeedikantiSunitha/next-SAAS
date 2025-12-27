import request from 'supertest';
import express from 'express';
import { getMetrics } from '../../routes/metrics';

const app = express();
app.get('/api/metrics', getMetrics);

describe('Metrics Endpoint', () => {
  describe('GET /api/metrics', () => {
    it('should return metrics in Prometheus format', async () => {
      const response = await request(app)
        .get('/api/metrics')
        .expect(200)
        .expect('Content-Type', /text\/plain/);
      
      expect(response.text).toContain('# HELP');
      expect(response.text).toContain('# TYPE');
    });

    it('should include HTTP request metrics', async () => {
      const response = await request(app)
        .get('/api/metrics')
        .expect(200);
      
      // Check for common Prometheus metric types
      expect(response.text).toMatch(/http_request/);
    });

    it('should return valid Prometheus format', async () => {
      const response = await request(app)
        .get('/api/metrics')
        .expect(200);
      
      // Prometheus format should have HELP and TYPE comments
      const lines = response.text.split('\n');
      const hasHelp = lines.some((line) => line.startsWith('# HELP'));
      const hasType = lines.some((line) => line.startsWith('# TYPE'));
      
      expect(hasHelp).toBe(true);
      expect(hasType).toBe(true);
    });

    it('should be accessible without authentication', async () => {
      // Metrics endpoint should be public (for Prometheus scraping)
      await request(app)
        .get('/api/metrics')
        .expect(200);
    });
  });
});

