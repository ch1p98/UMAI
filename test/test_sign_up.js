const { expect, assert, requester } = require("./setup");

//sign up without email

const invalid_user_data = {
  provider: "native",
  email: "",
  password: "",
};

describe("sign_up_test: ", () => {
  it("sign up with valid email form", async () => {
    const user = {
      name: `alex_at_${Date.now()}`,
      email: `alextai_${Date.now()}@gmail.com`,
      password: "password",
    };
    const user_public = {
      name: user.name,
      email: user.email,
    };
    const response = await requester.post("/signup").send(user);
    const response_result = response.body.data.state;

    expect(response_result).to.be("successful");
  });

  it("sign up with existed email", async () => {
    const user = {
      name: "alex",
      email: `alextai@gmail.com`,
      password: "password",
    };

    const res = await requester.post("/signup").send(user);

    expect(res.statusCode).to.equal(403);
  });
});
