require("dotenv").config();
const express = require("express");
const app = express();
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const { spawn } = require("child_process");
const port = 3000;

app.get("/pydemo", async (req, res) => {
  const python = spawn("python3", ["hw.py", "Fuchigami san"]);
  python.stdout.on("data", (data) => {
    const msg = "logging output:" + data.toString() + "\n";
    console.log(msg);
  });
  python.stderr.on("data", (data) => {
    console.log(`An error happened: ${data}`);
    res.status(502).send(data);
    return;
  });
  python.on("close", (code) => {
    const msg = `child process exit with status code ${code}`;
    console.log(msg);
    res.status(200).send(msg);
    return;
  });
});

app.listen(3000, () => {
  console.log("The server is running on localhost:3000");
});
