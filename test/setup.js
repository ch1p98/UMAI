const app = require("../app");
const chai = require("chai");
const deepEqualInAnyOrder = require("deep-equal-in-any-order");
const chaiHttp = require("chai-http");

chai.use(chaiHttp);
chai.use(deepEqualInAnyOrder);

const assert = chai.assert;
const expect = chai.expect;
const requester = chai.request(app).keepOpen();

before("tests initialized", async () => {});

module.exports = {
  expect,
  assert,
  requester,
};
