const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require("mongodb");
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// middle wares
app.use(cors());
app.use(express.json());

const uri =
  "mongodb+srv://lawyerMongodb:cYcF69bmSSGn7v5G@cluster0.wjzfsxz.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        const serviceCollection = client.db('legalAnalysis').collection('services');
        const reviewsCollection = client.db('legalAnalysis').collection('reviews');


        //JWT  Token
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
            res.send({ token })
        })


        //all data read
        app.get('/services', async (req, res) => {
            const query = {};
            const cursors = serviceCollection.find(query).sort({ $time: -1 })
            const services = await cursors.toArray()
            res.send(services)
        })

        //single service
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const service = await serviceCollection.findOne(query)
            res.send(service)
        })


        //service homepage
        app.get('/serviceshome', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query).sort({ $natural: -1 })
            const services = await cursor.limit(3).toArray()
            res.send(services)
        })

        //Create a single service
        app.post('/services', async (req, res) => {
            const addService = req.body;
            const result = await serviceCollection.insertOne(addService)
            res.send(result);
        })

        //Create a single reviews
        app.post('/reviews', async (req, res) => {
            const addReviews = req.body;
            const result = await reviewsCollection.insertOne(addReviews)
            res.send(result);
        })


        //all data reviews
        // app.get('/reviews', async (req, res) => {

        //     //JWT  Token
        //     // const decoded = req.decoded;
        //     // if (decoded.email !== req.query.email) {
        //     //     res.status(403).send({ message: 'unauthorized access' })
        //     // }

        //     let query = {}
        //     if (req.query.email) {
        //         query = {
        //             email: req.query.email
        //         }
        //     }
        //     const cursor = reviewsCollection.find(query)
        //     const review = await cursor.toArray()
        //     res.send(review)
        // })


        app.get('/reviews', verifyJWT, async (req, res) => {
            //JWT  Token
            const decoded = req.decoded;
            if (decoded.email !== req.query.email) {
                res.status(403).send({ message: 'unauthorized access' })
            }

            let query = {}
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            if (req.query.serviceId) {
                query = {
                    serviceId: req.query.serviceId
                }
            }
            const cursor = reviewsCollection.find(query).sort({ _id: -1 })
            const allReview = await cursor.toArray()
            res.send(allReview)
        })

        //single review data

        app.get('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const review = await reviewsCollection.findOne(query)
            res.send(review)
        })

        //delete review

        app.delete('/delete/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await reviewsCollection.deleteOne(query);
            console.log(result)
            res.send(result);
        })

        //get edit review usign id
        app.get('/review/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const review = await reviewsCollection.findOne(query)
            res.send(review)
        })



        app.put('/review/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const details = req.body;
            const option = { upsert: true };
            const updatedUser = {
                $set: {
                    review: details.review
                }
            }
            const result = await reviewsCollection.updateOne(filter, updatedUser, option);
            res.send(result);
        })

    } finally {
        //   await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Legal Analysis service is running')
})

app.listen(port, () => {
    console.log(`Legal Analysis firm running on the Server ${port}`);
})