//Importing the required libraries
var express = require("express");
var app = express();
var PropertiesReader = require("properties-reader");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const path = require('path');

//Setting up the express app
app.use(cors());
app.use(express.json());
app.set('json spaces', 3);



// Load properties from the file dbconnection.properties
var propertiesPath = path.resolve(__dirname, "./dbconnection.properties");
var properties = PropertiesReader(propertiesPath);

// Extract values from the properties file
const dbPrefix = properties.get('db.prefix');
const dbHost = properties.get('db.host');
const dbUser = properties.get('db.user');
const dbPassword = properties.get('db.password');
const dbParams = properties.get('db.params');

// MongoDB connection URL
const uri = `${dbPrefix}${dbUser}:${dbPassword}${dbHost}${dbParams}`;
// Creating a MongoClient with a MongoClientOptions
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });

var db1;//declare variable

//Connecting to Mongodb
async function connectDB() {
  try {
    client.connect();
    console.log('Connected to MongoDB');
    db1 = client.db('Coursework_CST3144');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
}

//calling the connectDB function to connect to MongoDB database
connectDB(); 


//Logging details about the collections accessed by the server
app.param('collectionName', async function (req, res, next, collectionName) {
  req.collection = db1.collection(collectionName);
  /*Checking the collection name for debugging*/
  console.log('Middleware set collection:', req.collection.collectionName);
  next();
});

// GET method to retreive tuition list
app.get('/collections/:collectionName', async function(req, res, next) {
    try{
        console.log("received request for Collection: ", req.params.collectionName);
        console.log("Accessing Collection: ", req.params.collectionName);
        //Retreive all documents from the tuition collection
        const results = await req.collection.find({}).toArray();
        //Logging results into console for debugging
        console.log("Retreived documents: ", results);

        res.json(results);
    }
    catch(err){
        console.error('Error fetching documents: ', err.message);
        next(err); //Pass error to the next middleware or error handler in the application
    }
});

//GET method to return queried tuition list
app.get('/collections/:collectionName/search', async function(req, res, next) {
    const num = Number(req.query.search)
    const query = {"$or":[{"subject": { $regex: req.query.search, $options: "i" }}, {"region": { $regex: req.query.search, $options: "i" }}, {"availableSeats": num}, {"price": num}]};
    try{
        console.log("received request to query Collection: ", req.params.collectionName);
        console.log("Accessing Collection: ", req.params.collectionName);
        //Retreive all the queried documents from the tuition collection
        const results = await req.collection.find(query).toArray();
        //Logging results into console for debugging
        console.log("Retreived documents: ", results);

        res.json(results); //Returning results to frontend
    }
    catch(err){
        console.error('Error fetching documents: ', err.message);
        next(err); //Pass error to the next middleware or error handler in the application
    }
});

//POST method to add new document in order collection
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

//PUT method to upload the documents in the tuition collection
app.put('/collections/:collectionName/:_id', async function(req, res, next) {
      try {
        console.log('Received request to update document with id:', req.params._id);

        //Updating document corresponding to the ObjectId
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

// Middleware function showing which url the server is responding to
app.use((req, res, next) => {
  console.log("In comes a request to: " + req.url);
  next(); // Ensure next middleware or route is called before sending response
});

//Sends error in case the file not found
app.use((req, res) => {
  res.status(404).send("Resource not found");
}); //must be at the end

// Starting the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});