const express = require("express");
const app = express();
const expressEjsLayout = require("express-ejs-layouts");
const path = require("path");


app.set("view engine", "ejs");
app.set("layout", "layouts/layout");
app.use(expressEjsLayout);
app.use(express.static(path.join(__dirname, "/public")));



app.use("/", require("./routes/index"));


app.listen(process.env.PORT || 3000, "0.0.0.0", () => {
    console.log("SERVER STARTED");
})