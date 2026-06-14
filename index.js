const dns = require("node:dns")
dns.setServers(['8.8.8.8','8.8.4.4',"1.1.1.1"])
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Root Route
app.get('/', (req, res) => {
    res.send('HireLoop Server is Running!');
});


const uri = process.env.MONGODB_URI

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


async function run() {
    
    try {
        // Connect the client to the server
        await client.connect();
        
        const db = client.db("HireLoop");
        const jobCollection = db.collection('jobs');

        app.get('/api/jobs', async(req, res)=>{
            const query = {}
            if(req.query.companyId) query.companyId = Number(req.query.companyId)
            if(req.query.status) query.status = req.query.status
            
            const cursor = jobCollection.find(query)
            const result = await cursor.toArray();
            res.send(result)
        })

        app.post('/api/jobs', async(req, res)=>{
            const job = req.body;
            const result = await jobCollection.insertOne(job);
            res.send(result);
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("🟢 Pinged your deployment. You successfully connected to MongoDB!");

        app.listen(port, () => {
            console.log(`🚀 Server listening on port ${port}`);
        });

    } catch (error) {
        console.error("🔴 Failed to connect to MongoDB:", error);
    }
}

run().catch(console.dir);