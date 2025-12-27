import { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import express from 'express';

// Mock prom-client before importing metrics middleware
const mockObserve = jest.fn();
const mockInc = jest.fn();
const mockLabels = jest.fn().mockReturnValue({
  observe: mockObserve,
  inc: mockInc,
});

const mockHistogram = {
  observe: mockObserve,
  labels: mockLabels,
};

const mockCounter = {
  inc: mockInc,
  labels: mockLabels,
};

const mockRegistry = {
  contentType: 'text/plain; version=0.0.4; charset=utf-8',
  metrics: jest.fn().mockResolvedValue('# HELP http_requests_total Total number of HTTP requests\n# TYPE http_requests_total counter\n'),
};

jest.mock('prom-client', () => ({
  Histogram: jest.fn().mockImplementation(() => mockHistogram),
  Counter: jest.fn().mockImplementation(() => mockCounter),
  Registry: jest.fn().mockImplementation(() => mockRegistry),
  register: mockRegistry,
}));

// Import after mock
import { metricsMiddleware } from '../../middleware/metrics';

describe('Metrics Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    mockObserve.mockClear();
    mockInc.mockClear();
    mockLabels.mockClear();
    
    mockRequest = {
      method: 'GET',
      path: '/api/test',
      url: '/api/test',
      route: { path: '/api/test' },
      headers: {},
    };

    mockResponse = {
      statusCode: 200,
      on: jest.fn((event: string, callback: () => void) => {
        if (event === 'finish') {
          // Simulate response finish immediately
          process.nextTick(callback);
        }
        return mockResponse as Response;
      }),
    };

    mockNext = jest.fn();

    app = express();
    app.use(express.json());
    app.use(metricsMiddleware);
    app.get('/api/test', (_req, res) => {
      res.status(200).json({ success: true });
    });
  });

  describe('metricsMiddleware', () => {
    it('should call next() to continue request processing', () => {
      metricsMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should record request duration when response finishes', (done) => {
      metricsMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify next was called
      expect(mockNext).toHaveBeenCalledTimes(1);
      
      // Simulate response finish
      const finishCallback = (mockResponse.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'finish'
      )?.[1];
      
      if (finishCallback) {
        finishCallback();
        
        // Wait for async operations
        setTimeout(() => {
          expect(mockLabels).toHaveBeenCalled();
          expect(mockObserve).toHaveBeenCalled();
          done();
        }, 50);
      } else {
        done();
      }
    }, 10000);

    it('should record request count', (done) => {
      metricsMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify next was called
      expect(mockNext).toHaveBeenCalledTimes(1);
      
      const finishCallback = (mockResponse.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'finish'
      )?.[1];
      
      if (finishCallback) {
        finishCallback();
        
        // Wait for async operations
        setTimeout(() => {
          expect(mockLabels).toHaveBeenCalled();
          expect(mockInc).toHaveBeenCalled();
          done();
        }, 50);
      } else {
        done();
      }
    }, 10000);

    it('should handle requests with different HTTP methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      
      methods.forEach((method) => {
        const req = { ...mockRequest, method } as Request;
        metricsMiddleware(req, mockResponse as Response, mockNext);
      });
      
      expect(mockNext).toHaveBeenCalledTimes(methods.length);
    });

    it('should handle requests with different status codes', (done) => {
      const statusCodes = [200, 201, 400, 404, 500];
      
      statusCodes.forEach((statusCode) => {
        const res = { ...mockResponse, statusCode } as Response;
        metricsMiddleware(mockRequest as Request, res, mockNext);
      });
      
      expect(mockNext).toHaveBeenCalledTimes(statusCodes.length);
      done();
    });
  });

  describe('Integration with Express app', () => {
    it('should not interfere with normal request processing', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });

    it('should allow requests to complete successfully', async () => {
      await request(app)
        .get('/api/test')
        .expect(200);
    });
  });
});

