import express from 'express';

import userRouter from "./src/router/auth_router";
const app = express();

app.use(express.json());
app.use("/api",userRouter);


const PORT = 3000;
app.listen(PORT, ()=>{
    console.log(`SERVER PORT Connect ${PORT}`);    
});