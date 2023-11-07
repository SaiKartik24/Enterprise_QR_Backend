const Employee = require('./models/Employee_Collection');
const Certificate = require('./models/certificate'); // Import the certificate schema
const CustomerInfo = require('./models/customerInfoCollection');
const Registration = require('./models/Registraction');
const jwt = require("jsonwebtoken");
const jwtSecret = 'babi ';
const otpGenerator = require('otp-generator'); // You may need to install this package
const logger = require('../logger/logger'); // Import the logger module

const base64Img = require('base64-img');
// Import the Complaint model
const Complaint = require('./models/Complaints'); // Assuming your model is in a separate file
const Jimp = require('jimp');

const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

const multer = require('multer');

// Define the storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Set the destination folder for storing uploaded images
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `${timestamp}-${file.originalname}`); // Set a unique filename for each uploaded image
  },
});

// Create a multer instance with the defined storage
const upload = multer({ storage: storage });






let currentagent = 4000; // Initialize the current agent number
let currentCustomer = 2000; // Initialize the current customer number

const getNextEmpIDagent = async () => {
    while (true) {
        const candidateId = `AG${currentagent}`;
        const existingAgent = await Registration.findOne({ Emp_ID: candidateId });
        if (!existingAgent) {
            currentagent++;
            return candidateId;
        }
        currentagent++;
    }
};

const getNextEmpIDcus = async () => {
    while (true) {
        const candidateId = `CM${currentCustomer}`;
        const existingCustomer = await Registration.findOne({ Emp_ID: candidateId });
        if (!existingCustomer) {
            currentCustomer++;
            return candidateId;
        }
        currentCustomer++;
    }
};

const registerPost = async (req, res) => {
    try {
        const { First_name, Last_name, Role, Email, Phone, Password } = req.body;

        if (!First_name || !Last_name || !Role || !Email || !Phone || !Password) {
            throw new Error("All fields (First_name, Last_name, Role, Email, Phone, and Password) are required.");
        }

        const existingUser = await Registration.findOne({ Email });
        const existingPhoneNumber = await Registration.findOne({ Phone });
        if (existingUser) {
            return res.status(400).json({
                message: "This Email is already registered. Please use a different email.",
            });
        }
        if (existingPhoneNumber) {
            return res.status(400).json({
                message: "This phone number is already registered. Please use a different phone number.",
            });
        }

        let Emp_ID;
        if (Role === 'Agent') {
            Emp_ID = await getNextEmpIDagent();
        } else if (Role === 'Customer') {
            Emp_ID = await getNextEmpIDcus();
        }

        const newUserRegistration = new Registration({
            First_name,
            Last_name,
            Role,
            Email,
            Phone,
            Password,
            Emp_ID,
        });

        await newUserRegistration.save();

        res.status(201).json({
            message: "User Successfully Registered...! Now You Can Login",
        });
    } catch (error) {
        logger.error(error);
        res.status(500).json({
            message: "Error occurred while registering user",
            error: error.message,
        });
    }
};



//Login
const UserLogin = async (req, res) => {
  const { Password, empId } = req.body;

  if (!Password || !empId) {
      return res.status(400).json({ error: 'Password and empId are required.' });
  }

  try {
      const user = await Employee.findOne({ empId });

      if (!user) {
          return res.status(401).json({ error: 'Invalid credentials.' });
      }

      if (user.password !== Password) {
          return res.status(401).json({ error: 'Invalid credentials.' });
      }

      const token = jwt.sign(
          {
              id: user._id,
              First_name: user.firstName,
              Last_name: user.lastName,
              Phone: user.phone,
              Email: user.email,
              Role: user.role,
              empId: user.empId
          },
          jwtSecret,
          { expiresIn: '1h' }
      );

      res.status(200).json({ message: 'Authentication successful.', token });
  } catch (error) {
    logger.error('Error checking user:', error);
      res.status(500).json({ error: 'An error occurred while checking user.' });
  }
}







let currentAgent = 1000; // Initialize the current agent number

const generateAgentId = async () => {
  try {
    // Find the highest existing agent ID in the database
    const highestAgent = await Employee.findOne({}, { empId: 1 }).sort({ empId: -1 });

    // Initialize the currentAgent number based on the highest existing agent ID
    if (highestAgent) {
      const lastAgentId = highestAgent.empId;
      const lastNumber = parseInt(lastAgentId.slice(2)); // Extract the number part
      currentAgent = lastNumber + 1;
    }

    // Generate the candidate ID
    const candidateId = `AG${currentAgent}`;

    // Ensure the candidate ID doesn't already exist in the database
    const existingAgent = await Employee.findOne({ empId: candidateId });

    if (!existingAgent) {
      // If no agent with this ID exists, return the ID
      currentAgent++;
      return candidateId;
    }

    // If the ID already exists, increment currentAgent and try again
    currentAgent++;
    return generateAgentId(); // Recursively call the function to find the next available ID
  } catch (error) {
    logger.error('Error generating agent ID:', error);
    throw new Error('Failed to generate agent ID');
  }
};


const createAgent = async (req, res) => {
  try {
    const empId = await generateAgentId();

    const Agent = {
      empId,
     userName: req.body.userName,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      activeState: req.body.activeState,
      role: req.body.role,
      password: req.body.password,
      designation: req.body.designation,
      jobType: req.body.jobType,
      jobDescription: req.body.jobDescription,
      image:  req.body.image,
      rating: req.body.rating,
      review: req.body.review,
      serviceType: req.body.serviceType,
      workExperience: req.body.workExperience,
      qrCode: req.body.qrCode,
      certifications: req.body.certifications || [], // Use the provided certification array or an empty array if not provided
    };
    const newEmployee = new Employee(Agent);
    await newEmployee.save(); // Save the new employee document to the database
    res.status(201).json(newEmployee);
  } catch (error) {
    logger.error('Error creating agent:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

let certificateid = 3000; // Initialize the current complaint ID

const generatecertificateid = async () => {
  try {
    // Find the highest existing agent ID in the database
    const highestAgent = await Certificate.findOne({}, { certificateId: 1 }).sort({ certificateId: -1 });

    // Initialize the currentAgent number based on the highest existing agent ID
    if (highestAgent) {
      const lastAgentId = highestAgent.certificateId;
      const lastNumber = parseInt(lastAgentId.slice(2)); // Extract the number part
      certificateid = lastNumber + 1;
    }

    // Generate the candidate ID
    const candidateId = `CE${certificateid}`;

    // Ensure the candidate ID doesn't already exist in the database
    const existingAgent = await Certificate.findOne({ certificateId: candidateId });

    if (!existingAgent) {
      // If no agent with this ID exists, return the ID
      certificateid++;
      return candidateId;
    }

    // If the ID already exists, increment currentAgent and try again
    certificateid++;
    return generatecertificateid(); // Recursively call the function to find the next available ID
  } catch (error) {
    logger.error('Error generating agent ID:', error);
    throw new Error('Failed to generate agent ID');
  }
};

const createCertificate = async (req, res) => {

    try {
      const certificateid = await generatecertificateid(); // Add "await" here

      const certificateData = {
        certificateid,
        name: req.body.name,
        type: req.body.type,
        description: req.body.description,
        duration: req.body.duration,
      };
  
      const newCertificate = new Certificate(certificateData);
      await newCertificate.save(); // Save the new certificate document to the database
      res.status(201).json(newCertificate);
    } catch (error) {
      logger.error('Error creating certificate:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };


  const getAllCertificates = async (req, res) => {
    try {
      const certificates = await Certificate.find(); // Retrieve all certificates from the database
      res.status(200).json(certificates);
    } catch (error) {
      logger.error('Error retrieving certificates:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  const getAllEmployees = async (req, res) => {
    try {
      const employees = await Employee.find(); // Retrieve all certificates from the database

      res.status(200).json(employees);
    } catch (error) {
      logger.error('Error retrieving certificates:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  const getAllEmployeesByID = async (req, res) => {
    try {
      const { empId } = req.params; // Get the serviceType from URL parameters
  
      const employees = await Employee.find({ empId }); // Retrieve employees with the specified serviceType

      if (!employees || employees.length === 0) {
        return res.status(404).json({ error: 'No employees found for the given serviceType' });
      }
  
      res.status(200).json(employees);

    } catch (error) {
      logger.error('Error retrieving employees by serviceType:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  const getAllEmployeesByServiceType = async (req, res) => {
    try {
      const { serviceType } = req.params; // Get the serviceType from URL parameters
  
      const employees = await Employee.find({ serviceType }); // Retrieve employees with the specified serviceType
  
      if (!employees || employees.length === 0) {
        return res.status(404).json({ error: 'No employees found for the given serviceType' });
      }
  
      res.status(200).json(employees);
    } catch (error) {
      logger.error('Error retrieving employees by serviceType:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  






  const nodemailer = require('nodemailer');

  // Function to generate a random OTP
  function generateOTP() {
    return Math.floor(1000 + Math.random() * 9000); // Generate a 4-digit OTP
  }
  
  // Function to send OTP via email
  function sendOTPviaEmail(email, otp) {
    const transporter = nodemailer.createTransport({
      service: 'Gmail', // e.g., 'Gmail'
      auth: {
        user: 'barnbastelagareddy123@gmail.com',
        pass: 'bfeokdbsgiixadtm',
      },
    });
  
    const mailOptions = {
      from: 'barnbastelagareddy123@gmail.com',
      to: email,
      subject: 'Your OTP for QR Code Validation',
      text: `Your OTP is: ${otp}`,
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        logger.error('Error sending OTP:', error);
      } else {
        logger.info('OTP sent:', info.response);
      }
    });
  }
  
  const otpCache = {}; // Cache to store OTPs
  

  const sendingOtp = async (req, res) => {
    try {
      const { empId, email } = req.params; // Get the employee ID and email from URL parameters
      const otp = generateOTP(); // Generate an OTP
  
      // Send the OTP via email
      sendOTPviaEmail(email, otp);
  
      // Save the OTP in a cache for verification
      otpCache[empId] = otp;
  
      res.status(200).json({ message: 'OTP sent via email' });
    } catch (error) {
      logger.error('Error generating OTP:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  


  const getAllEmployeesWithQR = async (req, res) => {
    try {
      const { empId } = req.params; // Get the employee ID from URL parameters
      const { userEnteredOTP } = req.body; // Get userEnteredOTP from the request body

      // Retrieve the employee from the database based on the provided empId as a string
      const employee = await Employee.findOne({ empId });
  
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }
  
      const certificationsData = employee.certifications.map((certification) => {
        return `Certificate ID: ${certification.certificateId}, Status: ${certification.status},
        PendingDays: ${certification.pendingDays}`;
      });
  
      const certificationsInfo = certificationsData.join('\n'); // Join the certification data with line breaks
  
      if (userEnteredOTP && otpCache[empId] === userEnteredOTP) {

        // If OTP is valid, proceed to generate and display the QR code
  
        // Generate the QR code data using the employee's data, including empId
        const data = ` ID: ${employee.empId},  Name: ${employee.userName},
        Email: ${employee.email}, Phone: ${employee.phone},
         Role: ${employee.role}, Designation: ${employee.designation}, 
         Job Type: ${employee.jobType}, Job Description: ${employee.jobDescription},
          Rating: ${employee.rating}, Review: ${employee.review}, Service Type: ${employee.serviceType},
           Work Experience: ${employee.workExperience}, Certifications:\n${certificationsInfo}`;
        const qrCodeFileName = `${employee.userName}-${employee.empId}.png`;
  
        await generateQRCode(data, qrCodeFileName);
        res.sendFile(qrCodeFileName, { root: __dirname });
  
        res.status(200).json({ message: 'QR code generated for the employee' });
      } else {
        res.status(401).json({ error: 'Invalid OTP' });
      }
    } catch (error) {
      logger.error('Error generating QR code:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  
  async function generateQRCode(data, fileName) {
    return new Promise((resolve, reject) => {
      QRCode.toFile(fileName, data, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
  
  





  // customerInfoController.js
  let currentOrder = 2000; // Initialize the current order number
  const generateOrderedId = async () => {
    try {
      // Find the highest existing agent ID in the database
      const highestAgent = await CustomerInfo.findOne({}, { customerId: 1 }).sort({ customerId: -1 });
  
      // Initialize the currentAgent number based on the highest existing agent ID
      if (highestAgent) {
        const lastAgentId = highestAgent.customerId;
        const lastNumber = parseInt(lastAgentId.slice(2)); // Extract the number part
        currentOrder = lastNumber + 1;
      }
  
      // Generate the candidate ID
      const candidateId = `CU${currentOrder}`;
  
      // Ensure the candidate ID doesn't already exist in the database
      const existingAgent = await CustomerInfo.findOne({ customerId: candidateId });
  
      if (!existingAgent) {
        // If no agent with this ID exists, return the ID
        currentOrder++;
        return candidateId;
      }
  
      // If the ID already exists, increment currentOrder and try again
      currentOrder++;
      return generateOrderedId(); // Recursively call the function to find the next available ID
    } catch (error) {
      logger.error('Error generating customer ID:', error);
      throw new Error('Failed to generate customer ID');
    }
  };
  
  const createCustomer = async (req, res) => {
    try {
      // Generate a unique customerId
      const customerId = await generateOrderedId(); // Add "await" here
  
      const currentDate = new Date();
      const utcDate = currentDate.toISOString();
  
      // Construct the customer data
      const customerData = {
        customerId, // Automatically generated customerId
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone,
        email: req.body.email,
        serviceType: req.body.type,
        date: utcDate, // Automatically captures the current date and time in UTC format
        description: req.body.description,
        status: req.body.status,
        address: req.body.address,
      };
  
      const newCustomer = new CustomerInfo(customerData);
      await newCustomer.save(); // Save the new customer document to the database
      res.status(201).json(newCustomer);
    } catch (error) {
      logger.error('Error creating customer:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  
  
  const getAllCustomers = async (req, res) => {
    try {
      
      // const customers = await CustomerInfo.find(); // Retrieve all customers from the database
      const cust = await CustomerInfo.find();
    const customers=cust.reverse()
      res.status(200).json(customers);
    } catch (error) {
      logger.error('Error retrieving customers:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  const updateCustomerStatus = async (customerId, status) => {
    try {
      const updatedCustomer = await CustomerInfo.findOneAndUpdate(
        { customerId },
        { $set: { status } },
        { new: true }
      );
      return updatedCustomer;
    } catch (error) {
      logger.error('Error updating customer status:', error);
      throw new Error('Internal Server Error');
    }
  };






const getcustomerById = async (req, res) => {
  try {
    const { customerId } = req.params;

    const complaint = await CustomerInfo.findOne({ customerId }); // Retrieve a Complaint with the specified complaintId

    if (!complaint) {
      return res.status(404).json({ error: 'No complaint found for the given complaintId' });
    }

    res.status(200).json(complaint);
  } catch (error) {
    logger.error('Error retrieving complaint by ID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
const getComplaints = async (req, res) => {
  try {
    const complaint = await Complaint.find(); // Retrieve all Complaints from the database
    const complaints=complaint.reverse()

    res.status(200).json(complaints);
  } catch (error) {
    logger.error('Error retrieving complaints:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getComplaintById = async (req, res) => {
  try {
    const { complaintId } = req.params;

    const complaint = await Complaint.findOne({ complaintId }); // Retrieve a Complaint with the specified complaintId

    if (!complaint) {
      return res.status(404).json({ error: 'No complaint found for the given complaintId' });
    }

    res.status(200).json(complaint);
  } catch (error) {
    logger.error('Error retrieving complaint by ID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getComplaintDataforagent = async (req, res) => {
  try {
    const agentId = req.params.agentId; // Assuming agentId is in the URL parameters

    // Find all complaint documents with the specified agentId
    const complaints = await Complaint.find({ agentId });

    if (complaints.length === 0) {
      return res.status(404).json({ error: 'No complaints found for the specified agent' });
    }

    // Fetch customer information for each complaint
    const customerInfo = [];

    for (const complaint of complaints) {
      const customer = await CustomerInfo.findOne({ customerId: complaint.customerId });
      if (customer) {
        customerInfo.push(customer);
      }
    }
    if (customerInfo.length === 0) {
      return res.status(404).json({ error: 'No customer information found for the specified agent' });
    }

    // Return an array of customer information
    res.status(200).json(customerInfo);
  } catch (error) {
    logger.error('Error fetching customer information by agentId:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};



const getComplaintData = async (req, res) => {
  try {
      const complaintId = req.params.complaintId; // Assuming complaintId is in the request parameters

      // Find the complaint document by complaintId
      const complaint = await Complaint.findOne({ complaintId });

      if (!complaint) {
          return res.status(404).json({ error: 'Complaint not found' });
      }

      // Fetch customer data based on customerId from the complaint
      const customer = await CustomerInfo.findOne({ customerId: complaint.customerId });

      if (!customer) {
          return res.status(404).json({ error: 'Customer not found' });
      }

      // Fetch agent data based on agentId from the complaint
      const agent = await Employee.findOne({ empId: complaint.agentId });

      if (!agent) {
          return res.status(404).json({ error: 'Agent not found' });
      }

      // Combine all the information and send it as a response
      const response = {
          complaint,
          customer,
          agent,
      };

      res.status(200).json(response);
  } catch (error) {
    logger.error('Error fetching complaint data:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getCompleteServiceData = async (req, res) => {
  try {
      //const complaintId = req.params.customerId; // Assuming complaintId is in the request parameters

      // Find the complaint document by complaintId
      const complaint = await Complaint.findOne({customerId: req.params.customerId} );

      if (!complaint) {
          return res.status(404).json({ error: 'Complaint not found' });
      }
// console.log(complaint.customerId,"658");
      // Fetch customer data based on customerId from the complaint
      const customer = await CustomerInfo.findOne({ customerId: complaint.customerId });

      if (!customer) {
          return res.status(404).json({ error: 'Customer not found' });
      }

      // Fetch agent data based on agentId from the complaint
      const agent = await Employee.findOne({ empId: complaint.agentId });

      if (!agent) {
          return res.status(404).json({ error: 'Agent not found' });
      }

      // Combine all the information and send it as a response
      const response = {
          complaint,
          customer,
          agent,
      };

      res.status(200).json(response);
  } catch (error) {
    logger.error('Error fetching complaint data:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
};


const getAllComplaints = async (req, res) => {
  try {
    // Find all documents from the Complaint collection and exclude the _id field
    const complaints = await Complaint.find({}, { _id: 0 });

    if (!complaints || complaints.length === 0) {
      return res.status(404).json({ error: 'No complaints found' });
    }

    const data = [];

    for (const complaint of complaints) {
      // Fetch customer data based on customerId from the complaint and exclude the _id field
      const customer = await CustomerInfo.findOne({ customerId: complaint.customerId }, { _id: 0 });

      // Fetch agent data based on agentId from the complaint and exclude the _id field
      const agent = await Employee.findOne({ empId: complaint.agentId }, { _id: 0 });

      // Combine all the information into a single object
      const response = {
        complaint,
        customer,
        agent,
      };

      data.push(response);
    }

    res.status(200).json(data);
  } catch (error) {
    logger.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

//update  customer status by complaint id
const updatestatusbycomplaintid = async (req, res) => {
  try {
    const complaintId = req.params.complaintId;
    const { status } = req.body;

    console.log('Status data:', status);

    const complaint = await Complaint.findOne({ complaintId: complaintId });

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const customerId = complaint.customerId;

    // Fetch the current customer status
    const existingCustomer = await CustomerInfo.findOne({ customerId: customerId });
    
    // Check if the new status is the same as the existing status
    if (existingCustomer && existingCustomer.status === status) {
      return res.status(400).json({ error: 'Status is already updated' });
    }

    // Assuming you want to update the 'status' field in the Customer model
    // Make sure that 'status' in the request body only contains the new status value
    // For example: { "status": "NewStatusValue" }
    if (status) {
      const updateResult = await CustomerInfo.updateOne({ customerId: customerId }, { $set: { status: status } });
      if (updateResult.modifiedCount === 0) {
        console.log("line 754", updateResult.modifiedCount);
        return res.status(500).json({ error: 'Error updating customer status' });
      }
    } else {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const updatedCustomer = await CustomerInfo.findOne({ customerId: customerId });

    res.status(200).json(updatedCustomer);
  } catch (error) {
    logger.error("line 758", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


 
const transporter = nodemailer.createTransport({
  service: 'Gmail', // e.g., 'Gmail'
  auth: {
    user: 'barnbastelagareddy123@gmail.com',
    pass: 'bfeokdbsgiixadtm',
  },
});

let complaintdataId = 4000; 
const generateComplaintId = async () => {
  try {
    // Find the highest existing agent ID in the database
    const highestAgent = await Complaint.findOne({}, { complaintId: 1 }).sort({ complaintId: -1 });

    if (highestAgent) {
      const lastAgentId = highestAgent.complaintId;
      const lastNumber = parseInt(lastAgentId.slice(2)); 
      complaintdataId = lastNumber + 1;
    }

    // Generate the candidate ID
    const candidateId = `CM${complaintdataId}`;

    // Ensure the candidate ID doesn't already exist in the database
    const existingAgent = await Complaint.findOne({ complaintId: candidateId });

    if (!existingAgent) {
      // If no agent with this ID exists, return the ID
      complaintdataId++;
      return candidateId;
    }

    // If the ID already exists, increment currentAgent and try again
    complaintdataId++;
    return generatecertificateid(); // Recursively call the function to find the next available ID
  } catch (error) {
    logger.error('Error generating complaintdataId :', error);
    throw new Error('Failed to generate complaintdataId ');
  }
};
let globalOTP;

const createComplaint = async (req, res) => {
  // const base64Url = req.body.agentQr;
  const base64Data = req.body.agentQr;
  const borderWidth = 5; // Desired border size in pixels

  let borderedImage; // Define borderedImage at a higher scope

  try {
    const image = await Jimp.read(Buffer.from(base64Data.split('base64,')[1], 'base64'));
    const imageWidth = image.bitmap.width;
    const imageHeight = image.bitmap.height;
    
    // Calculate new dimensions for the bordered image
    const newWidth = imageWidth + 2 * borderWidth;
    const newHeight = imageHeight + 2 * borderWidth;

    // Create a new image with a white background
    borderedImage = new Jimp(newWidth, newHeight, 0xffffffff);

    // Calculate the position to paste the original image
    const xOffset = borderWidth;
    const yOffset = borderWidth;

    // Resize the original image to fit within the border
    image.resize(imageWidth + borderWidth, imageHeight + borderWidth);

    // Paste the original image onto the bordered image
    borderedImage.composite(image, xOffset, yOffset);
  } catch (error) {
    logger.error('Error processing image:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
  try {
    const complaintId = await generateComplaintId();

    const complaintData = {
      complaintId,
      customerId: req.body.customerId,
      agentId: req.body.agentId,
    };

      const newComplaint = new Complaint(complaintData);
      await newComplaint.save(); // Save the new complaint document to the database

      // Fetch customer data based on customerId
      const customer = await CustomerInfo.findOne({ customerId: req.body.customerId });

      if (!customer) {
          return res.status(404).json({ error: 'Customer not found' });
      }

      // Fetch agent data based on agentId
      const agent = await Employee.findOne({ empId: req.body.agentId });

      if (!agent) {
          return res.status(404).json({ error: 'Agent not found' });
      }

      // await borderedImage.writeAsync('tempImage.jpeg');
      globalOTP = otpGenerator.generate(6, { upperCase: false, specialChars: false, alphabets: false });

      // Send an email to the customer
      const customerMailOptions = {
          from: 'barnbastelagareddy123@gmail.com',
          to: customer.email, // Assuming you have an 'email' field in the customer document
          subject: 'Complaint Created',
                    // <h3>Your OTP is: ${globalOTP}</h3>

          html: `
          <h2>Welcome ${customer.firstName} </h2>
          <h3> ${customer.customerId} Use this ID to check Status </h3>

          <h4>your complaint has been successfully assigned. It has been assigned to' ${agent.firstName} ${agent.lastName}'.Thank you for reaching out!'

</h4>
<h4>Scan this QR-Code to view agent details<h4/>
          <p>Agent QR-Code: <img src="cid:unique@nodemailer.com" alt="agent info"/></p>
        `,
          attachments: [{
                  filename: 'image.png',
                  path:req.body.agentQr,
                  cid: 'unique@nodemailer.com' //same cid value as in the html img src
              }]      
        };

      // Send an email to the agent
      const agentMailOptions = {
          from: 'barnbastelagareddy123@gmail.com',
          to: agent.email, // Assuming you have an 'email' field in the agent document
          subject: 'New Complaint Assigned',
          text: `Hi ${agent.firstName}, a new complaint has been assigned to you. It belongs to ${customer.firstName}  ${customer.lastName}. Please take action accordingly.`,
        };

      transporter.sendMail(customerMailOptions, (customerError) => {
          if (customerError) {
            logger.error('Error sending email to customer:', customerError);
          }
          transporter.sendMail(agentMailOptions, (agentError) => {
              if (agentError) {
                logger.error('Error sending email to agent:', agentError);
              }
              res.status(201).json({ complaint: newComplaint, customer, agent });
          });
      });
  } catch (error) {
    logger.error('Error creating complaint:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
  
};

//otp for see agent data
const agentotp = async (req, res) => {
  const userEnteredOtp = req.body.userEnteredOtp;

  if (userEnteredOtp === globalOTP) {
    // OTP is correct.
    res.status(200).json({ success: true, message: 'Success: OTP is correct.' });
  } else {
    // OTP is incorrect.
    res.status(400).json({ success: false, message: 'Error: Invalid OTP.' });
  }
};

//otp for enter customer complaint
const otpStorage = {};

const sendotp = async (req, res) => {
  const { email } = req.body;

  // Ensure that the email is valid before proceeding
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  // Generate a random 6-digit OTP
  // const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });
  function generateNumericOtp(length) {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * digits.length);
      otp += digits[randomIndex];
    }
    return otp;
  }
  
  // Generate a 6-digit numeric OTP
  const otp = generateNumericOtp(6);
  
  // Store the OTP associated with the email for later verification
  otpStorage[email] = otp;

  const mailOptions = {
    from: 'barnbastelagareddy123@gmail.com',
    to: email,
    subject: 'OTP for Verification',
    text: `Your OTP is: ${otp}`,
  };

  transporter.sendMail(mailOptions, (error) => {
    if (error) {
      logger.error('Error sending OTP:', error);
      res.status(500).json({ error: 'Failed to send OTP' });
    } else {
      logger.info('OTP sent successfully');
      res.status(200).json({ message: 'OTP sent successfully' });
    }
  });
};


const Verifyotp = async (req, res) => {
  const { email, otp } = req.body;

  if (otpStorage[email] && otpStorage[email] === otp) {
    // If the provided OTP matches the stored OTP for the email, it's verified.
    res.status(200).json({ message: 'OTP verified successfully' });
  } else {
    res.status(400).json({ error: 'Invalid OTP' });
  }
};

function isValidEmail(email) {
  // You can implement a more robust email validation here if needed
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}








// const otpStore = {};



// const createComplaint = async (req, res) => {
//   // console.log("470",req.body);
//   const base64Url = req.body.agentQr;
//    console.log(base64Url);
 
//   try {
//     const complaintId = generateComplaintId();

//     const complaintData = {
//       complaintId,
//       customerId: req.body.customerId,
//       agentId: req.body.agentId,
//     };


//       const newComplaint = new Complaint(complaintData);
//       await newComplaint.save(); // Save the new complaint document to the database

//       // Fetch customer data based on customerId
//       const customer = await CustomerInfo.findOne({ customerId: req.body.customerId });

//       if (!customer) {
//           return res.status(404).json({ error: 'Customer not found' });
//       }
//       const generatedOTP = generateRandomOTP();
//       otpStore[req.body.customerId] = generatedOTP;
//       // Fetch agent data based on agentId
//       const agent = await Employee.findOne({ empId: req.body.agentId });

//       if (!agent) {
//           return res.status(404).json({ error: 'Agent not found' });
//       }
//       var buffer = Buffer.from(base64Url.split("base64,")[1], "base64");
//       // Send an email to the customer
//       const customerMailOptions = {
//           from: 'barnbastelagareddy123@gmail.com',
//           to: customer.email, // Assuming you have an 'email' field in the customer document
//           subject: 'Complaint Created',
//           html: `<h1>Welcome ${customer.firstName}</h1>
//           <p>your complaint has been successfully created. It has been assigned to' ${agent.firstName}  ${agent.lastName}'.Thank you for reaching out!'</p>
//           <p>Use this OTP for verification: ${generatedOTP}</p>`,
//           attachments: [
//             {
//               filename: req.body.agentId+'_'+agent.firstName+'.jpeg', // Name of the attachment
//               content: buffer, // Base64-encoded image data
//               encoding: 'base64', // Specify the encoding
//             },
//           ],
  
//         };

//       // Send an email to the agent
//       const agentMailOptions = {
//           from: 'barnbastelagareddy123@gmail.com',
//           to: agent.email, // Assuming you have an 'email' field in the agent document
//           subject: 'New Complaint Assigned',
//           text: `Hi ${agent.firstName}, a new complaint has been assigned to you. It belongs to ${customer.firstName}  ${customer.lastName}. Please take action accordingly.`,
//         };

//       transporter.sendMail(customerMailOptions, (customerError) => {
//           if (customerError) {
//               console.error('Error sending email to customer:', customerError);
//           }
//           transporter.sendMail(agentMailOptions, (agentError) => {
//               if (agentError) {
//                   console.error('Error sending email to agent:', agentError);
//               }
//               res.status(201).json({ complaint: newComplaint, customer, agent });
//           });
//       });
//   } catch (error) {
//       console.error('Error creating complaint:', error);
//       res.status(500).json({ error: 'Internal Server Error' });
//   }
// };
// function generateRandomOTP() {
//   return Math.floor(1000 + Math.random() * 9000).toString();
// }


// const verifyOTP = (submittedOTP, generatedOTP) => {
//   if (submittedOTP === generatedOTP) {
//     return true; // OTP is correct
//   }
//   return false; // Incorrect OTP
// };

// const fetchAgentData = (req, res) => {
//   const submittedOTP = req.body.otp; // OTP submitted by the customer
//   const customerId = req.body.customerId; // Customer ID

//   // Retrieve the stored OTP
//   const generatedOTP = otpStore[customerId];

//   if (!generatedOTP) {
//     return res.status(401).json({ error: 'OTP not found' });
//   }

//   if (verifyOTP(submittedOTP, generatedOTP)) {
//     // OTP is correct, proceed to fetch agent data
//     // Fetch agent data based on agentId

//     // Updated Mongoose query to fetch agent by empId
//     Employee.findOne({ empId: req.body.agentId })
//       .exec()
//       .then((agent) => {
//         if (!agent) {
//           return res.status(404).json({ error: 'Agent not found' });
//         }
//         // Send response with agent data
//         res.status(200).json({ agent });
//       })
//       .catch((err) => {
//         console.error('Error fetching agent data:', err);
//         res.status(500).json({ error: 'Internal Server Error' });
//       });
//   } else {
//     // Incorrect OTP
//     res.status(401).json({ error: 'Invalid OTP' });
//   }
// };

module.exports = {getCompleteServiceData,updatestatusbycomplaintid,getComplaintDataforagent,agentotp,Verifyotp,sendotp,UserLogin,registerPost,getAllComplaints,getComplaintData,getcustomerById,getComplaints,getComplaintById,getAllEmployeesByID,createComplaint,getAllEmployeesByServiceType,sendingOtp,createAgent,createCertificate ,getAllCertificates ,getAllEmployees ,createCustomer,getAllEmployeesWithQR,getAllCustomers,updateCustomerStatus};
