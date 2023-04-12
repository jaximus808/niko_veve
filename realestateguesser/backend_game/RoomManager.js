import { customAlphabet } from "nanoid";
import cookie from "cookie"
import GameManager from "./GameManager.js";

const nanoid = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8)

export default function (io)
{

    this.rooms =  {

    };

    this.publicRooms = {

    }

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
        const privateGame = url[url.length -3] == "privategame"; 
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

        if(!this.rooms[roomCode] && privateGame)
        {
            socket.emit("returnHome")
            return 
        }
        else if(!this.publicRooms[roomCode] && !privateGame)
        {
            socket.emit("returnHome")
            return 
        }


        await socket.join(socketRoom)
        
        const room = (privateGame) ? this.rooms[roomCode] : this.publicRooms[roomCode];
        //console.log(room.players)
        socket.emit("InitGameInfo", 
            {
                players: room.players,
                gameState: room.gameState,
                timer: 5,
                round: 2,
                settings: room.settings, 
                maxPlayers: room.maxPlayers
            }
        )

        socket.on("joinGame", async(username) =>
        {
            if(room.players[socket.id]) return; 
            let goodJoin = room.addPlayer(socket.id, username, io)
            if(!goodJoin)
            {
                //will need to communicate back that they can't join
                socket.emit("fullLobbyConnect"); 
                return; 
            }
            socket.emit("connected",room.players[socket.id].admin)
            await socket.to(socketRoom).emit("playerJoin",socket.id,username, room.players[socket.id].admin)
            serverMessage(`${username} has just joined!`)

            if(room.serverAdmin && Object.keys(room.players).length == room.maxPlayers)
            {
                room.startGame(io); 
            }
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

    this.joinPublicRoom = () => 
    {
        if(Object.keys(this.publicRooms).length == 0) 
        {
            return this.createPublicRoom(); 
        }
        else 
        {
            const lastRoomId = Object.keys(this.publicRooms)[Object.keys(this.publicRooms).length-1] 

            if(Object.keys(this.publicRooms[lastRoomId].players).length == this.publicRooms[lastRoomId].maxPlayers )
            {
                //room is full
                return this.createPublicRoom(); 
            }
            else
            {
                return lastRoomId; 
            }

            
        }
    }
    
    this.createPublicRoom = () =>
    {
        const roomId = nanoid();

        this.publicRooms[roomId] = new GameManager(roomId, true, 4, ()=>
        {
            delete this.publicRooms[roomId]
        })
        return roomId; 
    }
    this.addRoom =  () =>
    {
        const roomId = nanoid();
        //console.log("WTF")
        //console.log(this.rooms)
        this.rooms[roomId] = new GameManager(roomId, false, 8,()=>
        {
            delete this.rooms[roomId]
            console.log("Room Deleted")
        })
        return roomId; 
        //do later
    }

    
    
}
