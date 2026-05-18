const express = require("express");
const Database = require("better-sqlite3");

const app = express();
const db = new Database("db.db");

app.use(express.static("public"));

app.get("/graph",(req,res)=>{
  res.json(db.prepare("SELECT * FROM edges").all());
});

app.listen(3000,()=>console.log("dashboard online"));
