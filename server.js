var express = require("express");
var app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const path = require('path');
app.use(cors());
app.use(express.json());
app.set('json spaces', 3);
// var myTuitions= require('./tuitions');

let PropertiesReader = require("properties-reader");
// Load properties from the file
let propertiesPath = path.resolve(__dirname, "./dbconnection.properties");
let properties = PropertiesReader(propertiesPath);

// Extract values from the properties file
const dbPrefix = properties.get('db.prefix');
const dbHost = properties.get('db.host');
const dbName = properties.get('db.name');
const dbUser = properties.get('db.user');
const dbPassword = properties.get('db.password');
const dbParams = properties.get('db.params');

// MongoDB connection URL
const uri = `${dbPrefix}${dbUser}:${dbPassword}${dbHost}${dbParams}`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });

let db1;//declare variable

async function connectDB() {
  try {
    client.connect();
    console.log('Connected to MongoDB');
    db1 = client.db('Coursework_CST3144');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
}

connectDB(); //call the connectDB function to connect to MongoDB database

//Optional if you want the get the collection name from the Fetch API in test3.html then
app.param('collectionName', async function (req, res, next, collectionName) {
  req.collection = db1.collection(collectionName);
  /*Check the collection name for debugging if error */
  console.log('Middleware set collection:', req.collection.collectionName);
  next();
});



app.get("/", (req, res) => {
  res.send("Welcome to our homepage!");
});

app.get('/collections/:collectionName', async function(req, res, next) {
    try{
        console.log("received request for Collection: ", req.params.collectionName);
        console.log("Accessing Collection: ", req.params.collectionName);
        //Retreive all documents from the specified collection
        const results = await req.collection.find({}).toArray();
        //Log results into console for debugging
        console.log("Retreived documents: ", results);

        res.json(results); //Return results to frontend
    }
    catch(err){
        console.error('Error fetching documents: ', err.message);
        next(err); //Pass error to the next middleware or error handler in the application
    }
});

app.post('/collections/:collectionName', async function(req, res, next) {
  try{
        // TODO: Validate req.body
        console.log('Received request to insert document:', req.body);

        //Insert new doc
        const result = await req.collection.insertOne(req.body);

        //Debugging pupose 
        console.log('Inserted documents: ', result);

        //Returning result to frontend 
        res.json(result);
    }catch (err) {
        console.error('Error inserting documents: ', err.message);
        next(err); //Pass error to the next middleware or error handler in the application
    }
});

app.put('/collections/:collectionName/:_id', async function(req, res, next) {
      try {
        // TODO: Validate req.body
        console.log('Received request to update document with id:', req.params._id);

        //Update single doc
        const result = await req.collection.updateOne({ _id: new ObjectId(req.params._id) },
        { $set: req.body },
        { safe: true, multi: false });

        //Debugging pupose 
        console.log('Update operation result: ', result);

        //Returning result to frontend 
        res.json((result.matchedCount === 1) ? { msg: "success" } : { msg: "error" });
    } 
    catch (err) {
        console.error('Error inserting documents: ', err.message);
        next(err); //Pass error to the next middleware or error handler in the application
    }
});

// app.put('/collections/:collectionName/:id', async function(req, res, next) {
//       try {
//         // TODO: Validate req.body
//         var tuitionId = parseInt(req.params.id);
//         console.log('Received request to update document with id:', tuitionId);

//         //Update single doc
//         const result = await req.collection.updateOne({ id: tuitionId },
//         { $set: req.body },
//         { safe: true, multi: false });

//         //Debugging pupose 
//         console.log('Update operation result: ', result);

//         //Returning result to frontend 
//         res.json((result.matchedCount === 1) ? { msg: "success" } : { msg: "error" });
//     } 
//     catch (err) {
//         console.error('Error inserting documents: ', err.message);
//         next(err); //Pass error to the next middleware or error handler in the application
//     }
// });

app.delete('/collections/:collectionName/:id', async function(req, res, next) {
  try{
        // TODO: Validate req.body
        console.log('Received request to delete document with id:', req.params.id);

        //Insert new doc
        const result = await req.collection.deleteOne({ _id: new ObjectId(req.params.id) });

        //Debugging pupose 
        console.log('Delete operation result: ', result);

        //Returning result to frontend 
        res.json((result.deletedCount === 1) ? { msg: "success" } : { msg: "error" });
    }
    catch (err) {
        console.error('Error deleting documents: ', err.message);
        next(err); //Pass error to the next middleware or error handler in the application
    }
});
// Middleware function
app.use((req, res, next) => {
  console.log("In comes a request to: " + req.url);
  next(); // Ensure next middleware or route is called before sending response
});

app.use((req, res) => {
  res.status(404).send("Resource not found");
}); //must be at the end

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});