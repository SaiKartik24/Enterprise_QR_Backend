const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors"); // Import the cors middleware
const dotenv = require("dotenv").config();
const Server=require("./mongodb/Server_Logic")
app.use(bodyParser.json());
app.use(express.json());

const logger = require('./logger/logger'); // Import the logger module
app.use(cors());

// const allowedOrigin = 'https://frontend-qrcode-i3zx-pfgbvslup-barnbas-projects.vercel.app';

// // Configure CORS options
// const corsOptions = {
//   origin: allowedOrigin,
//   methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
//   optionsSuccessStatus: 204,
//   allowedHeaders: ["Content-Type", "Authorization"],
// };
// app.use(cors(corsOptions));

const ip='172.17.15.248';
const port = process.env.PORT;




mongoose
  .connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    logger.info("QR_Code_Employee MongoDB Connected");
  })
  .catch((error) => {
    logger.error(error);
  });

//Reg
app.post('/Registration', (req, res) => {
  Server.registerPost(req, res, () => { });
})
//login
app.post('/login', (req, res) => {
  Server.UserLogin(req, res, () => { });
})


//Agent  
  //Agent post 
  app.post('/Agentinsert',(req,res)=>{
    Server.createAgent(req,res,()=>
    {}); 
 }) 

 //All Agents get
 app.get('/getAgents',(req,res)=>{

  Server.getAllEmployees(req,res,()=>
  {}); 
}) 

// get agent by id
app.get('/getAgents/:empId', (req, res) => {
  
  Server.getAllEmployeesByID(req, res, () => {});
});

//get agent by servicetype
app.get('/getAgentsbyservice/:serviceType', (req, res) => {
  Server.getAllEmployeesByServiceType(req, res, () => {});
});


//Certificates
//Certificate post
 app.post('/createCertificate',(req,res)=>{
    Server.createCertificate(req,res,()=>
    {}); 
 })  


//certificate get
 app.get('/getCertificate',(req,res)=>{
    Server.getAllCertificates(req,res,()=>
    {}); 
 })  

 

//Customer 
//customer post
 app.post('/customer',(req,res)=>{
    Server.createCustomer(req,res,()=>
    {}); 
 })  

 //get all customers
 app.get('/getcustomers',(req,res)=>{
    Server.getAllCustomers(req,res,()=>
    {}); 
 })
//get customer by customerId 
app.get('/getcustomerById/:customerId', (req, res) => {
  Server.getcustomerById(req, res, () => {});
});


 //Customer update
 app.put('/customer/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { status } = req.body; // Destructure status and comments from the request body

    const updatedCustomer = Server.updateCustomerStatus(customerId, status);
    if (updatedCustomer) {
      // Success: Send a success message and the updated customer data
      res.status(200).json({ message: 'Customer updated successfully' });
    } else {
      // Error: Send an error message
      res.status(404).json({ error: 'Customer not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//update status by complaintid
app.put('/complaints/:complaintId',(req,res)=>{
  Server.updatestatusbycomplaintid(req,res,()=>
  {}); 
})


 //Complaints
 //Complaints post with sending mails 
 app.post('/complaints',(req,res)=>{
  Server.createComplaint(req,res,()=>
  {}); 
}) 
//complaints get
app.get('/getcomplents', (req, res) => {
  Server.getComplaints(req, res, () => {});
});

//get complaints by complaintId
app.get('/getcomplents/:complaintId', (req, res) => {
  Server.getComplaintById(req, res, () => {});
});



//all data complaints ,customers and agents
//get by complaintId
app.get('/getDataById/:complaintId', (req, res) => {
  Server.getComplaintData(req, res, () => {});
});
app.get('/getCompleteDataById/:customerId', (req, res) => {
  Server.getCompleteServiceData(req, res, () => {});
});
//get all data complaints ,customers and agents
app.get('/getAllComplaints', (req, res) => {
  Server.getAllComplaints(req, res, () => {});
});

//getcustomerdata based on agentid
app.get('/getcustomerinfo/:agentId', (req, res) => {
  Server.getComplaintDataforagent(req, res, () => {});
});

//Otp
app.post('/sendotp',(req,res)=>{
  Server.sendotp(req,res,()=>
  {}); 
}) 

//verify
app.post('/Verifyotp',(req,res)=>{
  Server.Verifyotp(req,res,()=>
  {}); 
}) 


//agentotp
app.post('/enterotp',(req,res)=>{
  Server.agentotp(req,res,()=>
  {}); 
}) 

//QRcode generating
//generating QR with id
app.get('/generate-qr-code/:empId', (req, res) => {
  Server.getAllEmployeesWithQR(req, res, () => {});
});
//sending otp to mail
app.get('/sendotp/:empId/:email', (req, res) => {
  Server.sendingOtp(req, res, () => {});
});


 app.get('/qremployee', Server.getAllEmployeesWithQR);






//geting agentdata based on otp verification
// app.post('/optpost', (req, res) => {
//   Server.fetchAgentData(req, res, () => {});
// });


 


app.listen(process.env.PORT, () => {
  logger.info(`Server is running on port ${process.env.PORT}`);
}); 
