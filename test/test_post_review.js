const { expect, assert, requester } = require("./setup");

const dummy_review = {
  restaurant_esid: Date.now(),
  restaurant_name: "Little Bistro",
  title: `good_${Date.now()}`,
  content: "still good",
  rating: 5,
  personal_token: "",
};

const dummy_user = { personal_token: "alex1@gmail.com" };
const dummy_password = "test";

describe("test post review", async () => {
  it("post review without signing in", async () => {
    const response = await requester.post("/review");
    expect(response.statusCode).to.equal(401);
  });

  it("post review with invalid token", async () => {
    const response = await requester
      .post("/review")
      .set("Authorization", dummy_review.personal_token);
    expect(response.statusCode).to.equal(403);
  });

  it("post review correctly", async () => {
    const get_auth_response = await requester.post("/signup").send({
      email: dummy_user.personal_token,
      name: "alex",
      password: dummy_password,
    });
    const token = get_auth_response.data.token;
    const response = await requester
      .post("/review")
      .set("Authorization", `Bearer ${token}`)
      .send(dummy_review);
    expect(response.statusCode).to.equal(200);
  });
});
