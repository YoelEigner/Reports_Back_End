const express = require("express");
const cors = require('cors');
var bodyParser = require('body-parser');
require('dotenv').config()
const router = require("./routes/router");
let app = express();
// const https = require('https');
// const fs = require('fs');



// const options = {
//     key: fs.readFileSync('../CFIR_Auth/certificates/key.pem'),
//     cert: fs.readFileSync('../CFIR_Auth/certificates/cert.pem')
// };


app.use(cors())

app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }));


app.use("/api/", router);

app.listen(7000)
// https.createServer(options, app).listen(7000)