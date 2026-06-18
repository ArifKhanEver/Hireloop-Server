const dns = require("node:dns");
dns.setServers(['8.8.8.8', '8.8.4.4', "1.1.1.1"]); // network fix

const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// ----------------- middleware-----------------
app.use(cors());
app.use(express.json());

// ----------------- Database Config -----------------
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let db, jobCollection, companyCollection;

async function connectDB() {
    try {
        await client.connect();
        db = client.db("HireLoop");
        jobCollection = db.collection('jobs');
        companyCollection = db.collection('companies');
        applicationCollection = db.collection('applications');
        planCollection = db.collection("plans");
        subscriptionCollection = db.collection("subscriptions")
        usersCollection = db.collection('user')

        await client.db("admin").command({ ping: 1 });
        console.log("🟢 Pinged your deployment. You successfully connected to MongoDB!");
    } catch (error) {
        console.error("🔴 Failed to connect to MongoDB:", error);
    }
}
connectDB();

const verifyDbReady = (req, res, next) => {
    if (!jobCollection || !companyCollection) {
        return res.status(503).json({ error: "Database is initializing, please try again in a moment." });
    }
    next();
};

// ----------------- API Router -----------------

// Root Route
app.get('/', (req, res) => {
    res.send('HireLoop Server is Running!');
});

// Jobs GET Route
app.get('/api/jobs', verifyDbReady, async (req, res) => {
    try {
        const query = {};
        if (req.query.companyId) query.companyId = req.query.companyId;
        if (req.query.status) query.status = req.query.status;

        const cursor = jobCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.get('/api/jobs/:id', async (req, res) => {
    const { id } = req.params;
    const query = { _id: new ObjectId(id) }
    const result = await jobCollection.findOne(query);
    res.json(result)
})

// Jobs POST Route
app.post('/api/jobs', verifyDbReady, async (req, res) => {
    try {
        const jobData = req.body;
        const job = { ...jobData, createdAt: new Date() };
        const result = await jobCollection.insertOne(job);
        res.send(result);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// Company POST Route
app.post('/api/companies', verifyDbReady, async (req, res) => {
    try {
        const company = { ...req.body, createdAt: new Date() };
        const result = await companyCollection.insertOne(company);
        res.send(result);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// Company get Route
app.get('/api/mycompany', verifyDbReady, async (req, res) => {
    try {
        const query = {};
        if (req.query.recruiterId) query.recruiterId = req.query.recruiterId;

        const result = await companyCollection.findOne(query);
        res.send(result);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
})


//Post application
app.post('/api/applications', verifyDbReady, async (req, res) => {
    try {
        const applicationData = { ...req.body, createdAt: new Date() };
        const result = await applicationCollection.insertOne(applicationData);
        res.send(result);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
})


// get all applications
app.get('/api/applications', verifyDbReady, async(req, res)=> {
    const query = {};
    if(req.query.applicantId){
        query.applicantId = req.query.applicantId
    }

    if(req.query.jobId){
        query.jobId = req.query.jobId
    }

    const result = await applicationCollection.find(query).toArray();
    res.json(result);
})


//Plan
app.get('/api/plans', verifyDbReady, async(req, res)=> {
    const query = {}
    if(req.query.planId){
        query.id = req.query.planId
    }

    const result = await planCollection.findOne(query)
    res.json(result);
})

//subscription
app.post('/api/subscriptions', verifyDbReady, async(req, res)=> {
    const data = { ...req.body, createdAt: new Date()}

    const result = await subscriptionCollection.insertOne(data)
    

    const filter = {email: data.email};
    const updateDocument = {
        $set: {
            plan: data.planId
        }
    }

    const updateResult = await usersCollection.updateOne(filter,updateDocument)
    res.json(updateResult)

})



// ----------------- Server Listening (instant) -----------------
app.listen(port, () => {
    console.log(`🚀 Server listening on port ${port}`);
});