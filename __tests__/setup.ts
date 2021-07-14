global.console = {
  ...console,

  warn: jest.fn(),
};

test.skip("skip", () => {}); // ignore "Your test suite must contain at least one test"
export default {};
