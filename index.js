const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors({
    origin:[
        "http://localhost:5173",
        "https://task-manager-b4c45.web.app",
        "https://task-manager-b4c45.firebaseapp.com"


    ],
    credentials: true,


}));

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gm35c.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // await client.connect();
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    const taskCollections = client.db('TaskManager').collection('tasks');

 
    app.post('/addTask', async (req, res) => {
        const newTask = req.body;
        const count = await taskCollections.countDocuments(); // Get the current count for the order
        newTask.order = count; // Set the order
        const result = await taskCollections.insertOne(newTask);
        res.send(result);
    });






    
    app.put('/updateTaskOrder', async (req, res) => {
        const tasks = req.body; 
    
        const updatePromises = tasks.map(task => {
            const filter = { _id: new ObjectId(task._id) };
            const updatedTask = {
                $set: {
                    order: task.order,
                    category: task.category, 
                },
            };
            return taskCollections.updateOne(filter, updatedTask);
        });
    
        await Promise.all(updatePromises);
        res.send({ success: true, message: 'Tasks updated successfully' });
    });
    


    

    // app.get('/myTasks', async(req,res)=>{
    //     const {email}=req.query

    //     console.log("Received email:", email);
    //     const query = { email: email };
    //     const tasks= await taskCollections.find(query).toArray()
    //     res.send(tasks)
    //   })


    app.get('/myTasks', async (req, res) => {
        const { email } = req.query;
        const query = { email: email };
        const tasks = await taskCollections.find(query).sort({ order: 1 }).toArray(); // Sort by order
        res.send(tasks);
    });
    






      app.get('/allTasks/:id', async (req, res) => {  
        console.log('Received request for:', req.params.id);
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await taskCollections.findOne(query);
        res.send(result);
    });
    


    app.delete('/myTask/:id', async(req,res)=>{
        const id = req.params.id;
        console.log("Received DELETE request for ID:", req.params.id);

        const query = { _id: new ObjectId(id) };
        const result = await taskCollections.deleteOne(query)
        res.send(result)
      })



      app.put('/updateTask/:id', async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const options = { upsert: true };
      
        const updatePost = req.body;
      
        const updatedPost = {
          $set: {
            title: updatePost.title,
        
            description: updatePost.description,
            category: updatePost.category,
          },
        };
      
        const result = await taskCollections.updateOne(filter, updatedPost, options);
      
        res.send(result);
      });




  } finally {
    // await client.close(); // Consider closing in more complex scenarios
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Task Management is running');
});

app.listen(port, () => {
  console.log(`My Task Management server is running on port ${port}`);
});