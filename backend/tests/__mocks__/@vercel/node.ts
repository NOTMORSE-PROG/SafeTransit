export type VercelRequest = Record<string, unknown>;
export type VercelResponse = {
  status: jest.Mock;
  json: jest.Mock;
  end: jest.Mock;
  setHeader: jest.Mock;
  send: jest.Mock;
};
