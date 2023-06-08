const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const user = process.env.MONGO_USER;
const pass = process.env.MONGO_PASS;
const uri = `mongodb+srv://${user}:${pass}@cluster0.oqkryfl.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const classCollaction = client.db("school").collection("class");
    const classSelectCollaction = client.db("school").collection("selectClass");

    //all class data get api
    app.get("/class", async (req, res) => {
      const data = await classCollaction.find().toArray();
      res.send(data);
    });

    // class seleceted data post api
    app.post("/select", async (req, res) => {
      const data = req.body;
      const result = await classSelectCollaction.insertOne(data);
      res.send(result);
    });

    //class selected data get using email api
    app.get("/select", async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { userEmail: req.query.email };
      }

      const data = await classSelectCollaction.find(query).toArray();
      res.send(data);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server is running");
});
app.listen(port, () => {
  console.log(`your server run on ${port}`);
});
