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
                gameState: room.gameState,
                timer: 5,
                round: 2,
            }
        )

        socket.on("joinGame", async(username) =>
        {
            console.log("MDOEOW")
            if(room.players[socket.id]) return; 
            room.addPlayer(socket.id, username)
            socket.emit("connected",room.players[socket.id].admin)
            console.log("should have been emitted ")
            console.log(socketRoom)
            await socket.to(socketRoom).emit("playerJoin",socket.id,username,room.players[socket.id].admin)
        })

        socket.on("chatMsg", (text) =>
        {
            console.log(text)
            text.trim(); 
            if(text.length == 0) return; 
            if(!room.players[socket.id]) return;
            console.log(room.players)
            console.log(room.players[socket.id].name)
            io.to(socketRoom).emit("chatMessage", 
            {
                user: room.players[socket.id].name,
                msg: text,
                admin: room.players[socket.id].admin,
                server: false
            })
            
        })


        socket.on("disconnect", () =>
        {
            if(!room.players[socket.id]) return;
            var needUpdate = room.removePlayer(socket.id, socket)
            socket.to(socketRoom).emit("disconnectPlayer", socket.id)
            if(needUpdate)
            {
                socket.to(socketRoom).emit("adminUpdate", Object.keys(room.players)[0])
            }
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
