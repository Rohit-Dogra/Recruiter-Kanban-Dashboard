const { sanitizeInput, sanitizeObject, SANITIZE_FIELDS } = require('../sanitize.middleware');

describe('sanitize.middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = {};
    next = jest.fn();
  });

  test('strips script tags from targeted fields', () => {
    req.body = {
      description: '<p>Hello</p><script>alert("xss")</script>',
      notes: '<b>Good</b><img src=x onerror=alert(1)>',
      content: '<a href="javascript:alert(1)">click</a>'
    };

    sanitizeInput(req, res, next);

    expect(req.body.description).toBe('<p>Hello</p>');
    expect(req.body.notes).toBe('<b>Good</b><img src="x">');
    expect(req.body.content).toBe('<a>click</a>');
    expect(next).toHaveBeenCalled();
  });

  test('preserves safe HTML in targeted fields', () => {
    req.body = {
      description: '<p>Job <strong>description</strong> with <em>formatting</em></p>',
      benefits: '<ul><li>Health insurance</li><li>401k</li></ul>'
    };

    sanitizeInput(req, res, next);

    expect(req.body.description).toBe('<p>Job <strong>description</strong> with <em>formatting</em></p>');
    expect(req.body.benefits).toBe('<ul><li>Health insurance</li><li>401k</li></ul>');
    expect(next).toHaveBeenCalled();
  });

  test('does not modify non-targeted fields', () => {
    req.body = {
      firstName: 'John<script>alert(1)</script>',
      email: 'test@example.com',
      title: 'Software Engineer<img src=x onerror=alert(1)>'
    };

    sanitizeInput(req, res, next);

    // Non-targeted fields are left as-is
    expect(req.body.firstName).toBe('John<script>alert(1)</script>');
    expect(req.body.email).toBe('test@example.com');
    expect(req.body.title).toBe('Software Engineer<img src=x onerror=alert(1)>');
    expect(next).toHaveBeenCalled();
  });

  test('handles nested objects', () => {
    req.body = {
      job: {
        description: '<script>alert("xss")</script>Safe text',
        requirements: '<p>Must know JS</p><script>bad</script>'
      }
    };

    sanitizeInput(req, res, next);

    expect(req.body.job.description).toBe('Safe text');
    expect(req.body.job.requirements).toBe('<p>Must know JS</p>');
    expect(next).toHaveBeenCalled();
  });

  test('handles arrays in body', () => {
    req.body = {
      coverLetter: '<p>Dear Hiring Manager</p><script>steal()</script>'
    };

    sanitizeInput(req, res, next);

    expect(req.body.coverLetter).toBe('<p>Dear Hiring Manager</p>');
    expect(next).toHaveBeenCalled();
  });

  test('calls next when body is empty', () => {
    req.body = {};
    sanitizeInput(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('calls next when body is undefined', () => {
    req.body = undefined;
    sanitizeInput(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('sanitizeObject handles all targeted fields', () => {
    const input = {};
    for (const field of SANITIZE_FIELDS) {
      input[field] = `<script>alert("${field}")</script>safe`;
    }

    const result = sanitizeObject(input);

    for (const field of SANITIZE_FIELDS) {
      expect(result[field]).toBe('safe');
    }
  });
});
