export function mockRes() {
  const res: Record<string, jest.Mock> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

export function mockReq(overrides: Record<string, unknown> = {}) {
  return {
    method: 'GET',
    headers: {},
    query: {},
    body: {},
    ...overrides,
  };
}

export function bearerHeader(token: string) {
  return { authorization: `Bearer ${token}` };
}
