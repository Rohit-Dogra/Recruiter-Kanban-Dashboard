const { requireAdmin } = require('../admin.middleware');

describe('admin.middleware - requireAdmin', () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: null };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  test('calls next when user is admin', () => {
    req.user = { id: 1, userType: 'admin' };
    requireAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('returns 403 when user is company type', () => {
    req.user = { id: 2, userType: 'company' };
    requireAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Admin access required' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 403 when user is candidate type', () => {
    req.user = { id: 3, userType: 'candidate' };
    requireAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 403 when req.user is null', () => {
    req.user = null;
    requireAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 403 when req.user is undefined', () => {
    req.user = undefined;
    requireAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
