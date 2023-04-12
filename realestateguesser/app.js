import dotenv from "dotenv"

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


import express from "express";

const app = express();

import {Server} from "socket.io"


import http from "http"

const httpServer = http.createServer(app)

const io = new Server(httpServer,{})

import cookieParser from "cookie-parser";

app.use(cookieParser());

app.use(express.json())
app.use(express.urlencoded({
    extended: false
}));

import RoomManager from "./backend_game/RoomManager.js"

const roomManager = new RoomManager(io);

app.post("/createRoom", (req, res) =>
{
    // const username = req.body.username; 
    // if(!username || username.replace(/\s/g, '') == '')
    // {
    //     res.send({error:true, msg:"missing username"})
    //     return; 
    // }

    const roomId = roomManager.addRoom()
    console.log("MEOW")

    //res.cookie("username", username, {maxAge: 9999999999, httpOnly:true})
    res.send({error:false, roomId: roomId})
})

app.get("/joinpublicroom", (req,res) =>
{
    const roomId = roomManager.joinPublicRoom()

    res.send({error:false, roomId: roomId})
})

app.post("/joinGame", (req, res)=>
{
    //const username = req.body.username; 
    const roomCode = req.body.roomId; 

    // if(!username || username.replace(/\s/g, '') == '')
    // {
    //     res.send({error:true, error:"missing username"})
    //     return; 
    // }
    //private room
    if(roomCode)
    {
        if(!roomManager.rooms[roomCode]) 
        {
            res.send({error:true, msg:"room does not exist"})
            return
        }
        else 
        {
            res.send({error:false, msg:"JOIN!"})
        }
    }
    else 
    {
        res.send({error:true, msg:"No error code submitted"})
    }

})

app.use("/privategame/:gameid", (req, res, next) =>
{
    
    next()

}, express.static(path.join(__dirname,'public', 'game')))

app.use("/publicgame/:gameid", (req, res, next) =>
{
    
    next()

}, express.static(path.join(__dirname,'public', 'game')))

app.use("/",express.static(path.join(__dirname,'public', 'home')));
app.use("/customgame",express.static(path.join(__dirname,'public', 'customGame')));
//app.use("/",require("./router/routes.js"));

httpServer.listen(process.env.PORT || 3000, console.log("Server up"));
