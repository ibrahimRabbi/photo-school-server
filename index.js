const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const stripe = require("stripe")(
  "sk_test_51NFaHHHYxG7WJPCTo6DyF8n9Ty7LHso58T2LKEWbMN1RnwDs6Vdb8c1AIEk6ywGP4JAayNmD8PMlNtmwQBIsvcjK00SvyfXze0"
);
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

//MIDDLEWERE
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
    const summeryCollaction = client.db("school").collection("summery");

    /***************************************class related all apiS**************************************/

    //all class data get api and data get using email query params
    app.get("/class", async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { instructorEmail: req.query.email };
      }
      const result = await classCollaction.find(query).toArray();
      res.send(result);
    });
      
    //add class post api
    app.post("/class", async (req, res) => {
      const data = req.body;
      const result = await classCollaction.insertOne(data);
      res.send(result);
    });

//class delete api 
    app.delete('/class/:id', async (req, res) => { 
      const id = { _id: new ObjectId(req.params.id)};
      const result = await classCollaction.deleteOne(id)
      res.send(result)
    })






    /****************************selacted class related apiS******************************** */

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

    //selected class delete api
    app.delete("/select/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await classSelectCollaction.deleteOne(query);
      res.send(result);
    });

     

    /****************************************PAYMENT GET WAY API **************************/

    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: price * 100,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });


    /*******************************payment summery related apiS *******************************/

    app.post("/summery", async (req, res) => {
      const data = req.body;
      const result = await summeryCollaction.insertOne(data);
      const query = {
        _id: { $in: data.selecetClassId.map((id) => new ObjectId(id)) },
      };
      const deleted = await classSelectCollaction.deleteMany(query);

      res.send({ result, deleted });
    });

    app.get("/summery", async (req, res) => {
      const query = { email: req.query?.email };
      const result = await summeryCollaction.find(query).toArray();
      res.send(result);
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























// if (req.query?.email) {
      //   const email = { email: req.query?.email };
      //   const value = await summeryCollaction.find(email).toArray();
      //   let arry = [];
      //   const data = value.map((v) => v.classId);
      //   data.forEach((v) => arry.push(...v));
      //   const query = {
      //     _id: { $in: arry.map((id) => new ObjectId(id)) },
      //   };
      //   const result = await classCollaction.find(query).toArray();
      //   res.send(result);
      // } else {
      //   const result = await classCollaction.find().toArray();
      //   res.send(result);
      // }