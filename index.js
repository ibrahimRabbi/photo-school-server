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
    const userCollaction = client.db("school").collection("users");
    const panndingCollaction = client.db("school").collection("pannding");





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

    //class data get using id 
    app.get('/class/:id', async(req,res)=> {
      const id = { _id: new ObjectId(req.params.id)};
      const result = await classCollaction.findOne(id)
      res.send(result)  
    })
      
    //add class post api
    app.post("/class", async (req, res) => {
      const data = req.body;
      const result = await classCollaction.insertOne(data);
      res.send(result);
    });

  
   

    //class update patch aPI
    app.patch('/update/:id', async (req, res) => {
      const data = req.body
      const id = { _id: new ObjectId(req.params.id) };
       const options = { upsert: true };
       
       const updateDoc = {
         $set: {
           className :data.className,
           classPrice : data.classPrice,
           availableSeats : data.availableSeats
         },
       };

  const result = await panndingCollaction.updateOne(id, updateDoc, options);
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

     
 
  /*************************************** PAYMENT GET WAY API **************************/ 
 

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


    /********************************payment-summery-related-api********************************/

    app.post("/summery", async (req, res) => {
      const data = req.body;
      const id = { _id: new ObjectId(data.selecetClassId) }

      const classId = { _id: new ObjectId(data.classId) }
      const classobj = await classCollaction.findOne(classId)
      const options = { upsert: true };
       const updateDoc = {
         $set: {
           availableSeats: classobj.availableSeats - 1,
           totalEnrolled: classobj.totalEnrolled + 1
         },
       };
      const updatedClass = await classCollaction.updateOne(classId,updateDoc,options)
      const result = await summeryCollaction.insertOne(data);
      const deleted = await classSelectCollaction.deleteOne(id);
      res.send({ result, deleted,updatedClass });
    });

 //payment history taken get api
    app.get("/summery", async (req, res) => {
      const query = { email: req.query?.email };
      const result = await summeryCollaction.find(query).toArray();
      res.send(result);
    });


    /******************************************user managment apiS*****************************/

    app.post('/user', async (req, res) => {
      const data = req.body
      const query = {email:data.email}
      const existing = await userCollaction.findOne(query)
      
      if (existing) {
        return res.send({message:'user already exist'})
      }
      
        const result = await userCollaction.insertOne(data);
        res.send(result);
     
})

    app.get('/user', async (req, res) => {
      let query = {}
      if (req.query?.email) {
        query = {email:req.query.email}
      }
      const userData = await userCollaction.find(query).toArray()
      res.send(userData)
})

    app.patch('/user/:id', async (req, res) => {
      const data = req.body
      const id = { _id: new ObjectId(req.params.id) };
       const options = { upsert: true };
       const updateDoc = {
         $set: {
            role : data.role
         },
      };
      const result = await userCollaction.updateOne(id, updateDoc, options)
      res.send(result)
})


/*****************************out side of or entermediatory apiS********************************* */

    app.post('/pannding', async (req, res) => {
      const data = req.body
      const result = await panndingCollaction.insertOne(data)
      res.send(result)
    })

    app.get('/pannding', async (req, res) => {
       let query = {}
      if (req.query?.email) {
        query = {instructorEmail : req.query.email}
      }
      const data = await panndingCollaction.find(query).toArray()
      res.send(data)
    })


 app.patch("/pannding/:id", async (req, res) => {
   const data = req.body;
   const id = { _id: new ObjectId(req.params.id) };
   const options = { upsert: true };
   const updateDoc = {
     $set: {
       status: data.status,
     },
   };
   const result = await panndingCollaction.updateOne(id, updateDoc, options);

   if (data.status == 'approved') {
     const getFromPannding = await panndingCollaction.findOne(id)
       await classCollaction.insertOne(getFromPannding)
    }
    res.send({result});
 });


  app.delete('/pannding/:id', async (req, res) => { 
      const id = { _id: new ObjectId(req.params.id)};
      const result = await panndingCollaction.deleteOne(id)
      res.send(result)
    })

    
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