const express = require("express");
const cors = require('cors');
var bodyParser = require('body-parser');
require('dotenv').config()
const router = require("./routes/router");
let app = express();



app.use(cors())

app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }));


// require("./configs/config");

app.use("/api/", router);

app.listen(7000);