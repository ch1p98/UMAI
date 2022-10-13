const { expect, assert, requester } = require("./setup");

describe("get campaign 1 to 4", async () => {
  it("get campaign 1", async () => {
    const response = await requester.get("/campaign/1");
    const result = response.data.result;
    const campaign = response.data.campaign;
    const index = campaign.index;
    const selected_campaign = campaign.selected_campaign;
    const response_size = result.length;

    expect(response_size).to.equal(10);
    expect(index).to.equal(1);
  });

  it("get campaign 2", async () => {
    const response = await requester.get("/campaign/2");
    const result = response.data.result;
    const campaign = response.data.campaign;
    const index = campaign.index;
    const selected_campaign = campaign.selected_campaign;
    const response_size = result.length;

    expect(response_size).to.equal(10);
    expect(index).to.equal(1);
  });

  it("get campaign 3", async () => {
    const response = await requester.get("/campaign/3");
    const result = response.data.result;
    const campaign = response.data.campaign;
    const index = campaign.index;
    const selected_campaign = campaign.selected_campaign;
    const response_size = result.length;

    expect(response_size).to.equal(10);
    expect(index).to.equal(1);
  });

  it("get campaign 4", async () => {
    const response = await requester.get("/campaign/4");
    const result = response.data.result;
    const campaign = response.data.campaign;
    const index = campaign.index;
    const selected_campaign = campaign.selected_campaign;
    const response_size = result.length;

    expect(response_size).to.equal(10);
    expect(index).to.equal(1);
  });

  it("get campaign hot", async () => {
    const response = await requester.get("/campaign/hot");
    const response_size = response.length.or_tlt;

    expect(res.statusCode).to.equal(400);
  });
});
