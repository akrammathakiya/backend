import dotenv from "dotenv";
import express from 'express'
import connectionDB from "./db/index.js";
 dotenv.config({
    path:'./.env'
 })
const app = express();
connectionDB()
.then(()=>{
   app.listen(process.env.PORT || 8000, ()=>{
      console.log(`server is running at :${process.env.PORT}`);
      
   })
})
.catch((error)=>{
   console.log("MONGODB connection Faild !!",error);
})

