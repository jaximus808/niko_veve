import { nanoid } from "nanoid";
import cookie from "cookie"
import GameManager from "./GameManager.js";

export default function (io)
{

    this.rooms =  {

    };

    this.io = io
    this.io.on("connection", async  (socket) =>
    {
        
        // if(!socket.handshake.headers.cookie)
        // {
        //     socket.emit("promptName")
        // }
        // else 
        // {
        //     var cookies = cookie.parse(socket.handshake.headers.cookie);  
        //     if(!cookies.username)
        //     {
        //         socket.emit("promptName")
        //     }
        // }
        const url = socket.request.headers.referer.split("/")
        const roomCode = url[url.length - 2];
        const socketRoom = "room-"+roomCode
        //console.log(roomCode )

        if(!this.rooms[roomCode])
        {
            socket.emit("returnHome")
            return 
        }
        await socket.join(socketRoom)

        const room = this.rooms[roomCode];
        //console.log(room.players)
        console.log("MEdwdadaOW")
        socket.emit("InitGameInfo", 
            {
                players: room.players,
                timer: 5,
                round: 2,
            }
        )

        socket.on("joinGame", async(username) =>
        {
            console.log("MDOEOW")
            if(room.players[socket.id]) return; 
            room.addPlayer(socket.id, username)
            socket.emit("connected")
            console.log("should have been emitted ")
            console.log(socketRoom)
            await socket.to(socketRoom).emit("playerJoin",socket.id,username)
        })

        socket.on("disconnect", () =>
        {
            room.removePlayer(socket.id)
            socket.to(socketRoom).emit("disconnectPlayer", socket.id)
        })

    })



    this.addRoom =  () =>
    {
        const roomId = nanoid();
        //console.log("WTF")
        //console.log(this.rooms)
        console.log(roomId)
        console.log("RU")
        this.rooms[roomId] = new GameManager()
        return roomId; 
        //do later
    }

    
    
}
