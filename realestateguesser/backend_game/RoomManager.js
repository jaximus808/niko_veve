import { customAlphabet } from "nanoid";
import cookie from "cookie"
import GameManager from "./GameManager.js";

const nanoid = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8)

export default function (io)
{

    this.rooms =  {

    };



    this.io = io
    this.io.on("connection", async  (socket) =>
    {

        //maybe make admin decided from first person to connect to the game 

        //also need to check if there is no admin when one person leaves 

        // need settings


        
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

        const serverMessage = (msg) =>
        {
            io.to(socketRoom).emit("chatMessage", 
            {
                user: "Server",
                msg: msg,
                admin: false,
                server: true
            })
        }

        if(!this.rooms[roomCode])
        {
            socket.emit("returnHome")
            return 
        }
        await socket.join(socketRoom)

        const room = this.rooms[roomCode];
        //console.log(room.players)
        socket.emit("InitGameInfo", 
            {
                players: room.players,
                gameState: room.gameState,
                timer: 5,
                round: 2,
                settings: room.settings
            }
        )

        socket.on("joinGame", async(username) =>
        {
            if(room.players[socket.id]) return; 
            room.addPlayer(socket.id, username)
            socket.emit("connected",room.players[socket.id].admin)
            await socket.to(socketRoom).emit("playerJoin",socket.id,username, room.players[socket.id].admin)
            serverMessage(`${username} has just joined!`)
        })

        socket.on("chatMsg", (text) =>
        {
            text.trim(); 
            if(text.length == 0) return; 
            if(!room.players[socket.id]) return;
            io.to(socketRoom).emit("chatMessage", 
            {
                user: room.players[socket.id].name,
                msg: text,
                admin: room.players[socket.id].admin,
                server: false
            })
            
        })

        socket.on("startGame", () =>
        {
            if(!room.players[socket.id].admin)return;
            serverMessage("Game Starting!")
            room.startGame(io); 
        })

        socket.on("guess", (price) =>
        {
            room.guessPrice(socket.id, price, this.io);
        })

        socket.on("changeSettings", (settingsUpdate) =>
        {
            room.changeSettings(socket.id, settingsUpdate)
            serverMessage("Settings Changed")
            io.to(socketRoom).emit("settingUpdate", room.settings)
        })


        socket.on("StartGame", ()=>
        {
            if(!room.players[socket.id].admin) return; 
            room.startGame(this.io)
        })

        socket.on("disconnect", () =>
        {
            if(!room.players[socket.id]) return;
            serverMessage(`${room.players[socket.id].name} has just left!`)
            var needUpdate = room.removePlayer(socket.id, socket)
            socket.to(socketRoom).emit("disconnectPlayer", socket.id)
            if(needUpdate)
            {
                socket.to(socketRoom).emit("adminUpdate", Object.keys(room.players)[0])
            }
        })

    })


    //create a button to listen to start game func

    this.addRoom =  () =>
    {
        const roomId = nanoid();
        //console.log("WTF")
        //console.log(this.rooms)
        this.rooms[roomId] = new GameManager(roomId)
        return roomId; 
        //do later
    }

    
    
}
