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

    //this is the full socket logic for the gmae, you can look at socket.io documentation about how it works more indepth
    //essentially the socket object is defines the specific connection, and here we're creating different listening 
    //functions

    //you can also use the socket to send data from the server using the socket connection to the specific client.
    //each socket has an ID using socket.id which is unique to each person 
    this.io.on("connection", async  (socket) =>
    {

        //gets the code the user joined from the link and if the game is private or pbulic 
        const url = socket.request.headers.referer.split("/")
        const roomCode = url[url.length - 2];
        const privateGame = url[url.length -3] == "privategame"; 
        const socketRoom = "room-"+roomCode
        //console.log(roomCode )

        //this is a function that sends messages from the server to client streamlined 
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

        //checks to make sure the room actually exists when they use the link 
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

        
        
        //references the room to use in the rest of the code to access functions and data 
        const room = (privateGame) ? this.rooms[roomCode] : this.publicRooms[roomCode];
        
        //give the initial game info to the client connecting
        

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
            //if the room exists then join the room 
            //rooms work by having certain sockets join a specific room with a name, when the server sends a message to that spcific room only the sockets in that room get the message. 
            //only if the player can join can the user get the information about the game and actually join the game room to recieve data. 
       
            await socket.join(socketRoom)
            socket.emit("InitGameInfo", 
            {
                players: room.players,
                gameState: room.gameState,
                timer: 5,
                round: 2,
                settings: room.settings, 
                maxPlayers: room.maxPlayers
            })
            //sends the connected emit to tell the client is connected 
            socket.emit("connected",room.players[socket.id].admin)
            await socket.to(socketRoom).emit("playerJoin",socket.id,username, room.players[socket.id].admin)
            serverMessage(`${username} has just joined!`)

            //in public games if the game room is full then start
            if(room.serverAdmin && Object.keys(room.players).length == room.maxPlayers)
            {
                room.startGame(io); 
            }
            
        
        })


        //if the user sends a chat message send to all clients in the room 
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

        

        //handle guesses 
        socket.on("guess", (price) =>
        {
            if(!room.players[socket.id]) return;
            room.guessPrice(socket.id, price, this.io);
        })

        //change settings 
        socket.on("changeSettings", (settingsUpdate) =>
        {
            room.changeSettings(socket.id, settingsUpdate)
            serverMessage("Settings Changed")
            io.to(socketRoom).emit("settingUpdate", room.settings)
        })

        //if the admin sends a startGame emit start the game
        socket.on("StartGame", ()=>
        {
            if(!room.players[socket.id].admin) return; 
            room.startGame(this.io)
        })
        
        //this is automatically handle when the client leaves the web page 
        socket.on("disconnect", () =>
        {
            if(!room.players[socket.id]) return;
            serverMessage(`${room.players[socket.id].name} has just left!`)
            var needUpdate = room.removePlayer(socket.id, socket)
            socket.to(socketRoom).emit("disconnectPlayer", socket.id)
            if(needUpdate)
            {
                socket.to(socketRoom).emit("adminUpdate", Object.keys(room.players)[0])

                Object.keys(room.players)[0].emit("showAdminPanel");
            }
        })

    })


    //when a user clicks join a public game it will add them to the most recently created game
    //if the game is already full then the server will create a new public room and that id will be used
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
    
    //when a new public room created it will create a new GameManager object and store that with the random ID 
    this.createPublicRoom = () =>
    {
        const roomId = nanoid();

        this.publicRooms[roomId] = new GameManager(roomId, true, 4, ()=>
        {
            delete this.publicRooms[roomId]
        })
        return roomId; 
    }

    //the same logic as the function above but added to the private rooms instead
    this.addRoom =  () =>
    {
        const roomId = nanoid();
        this.rooms[roomId] = new GameManager(roomId, false, 8,()=>
        {
            delete this.rooms[roomId]
            console.log("Room Deleted")
        })
        return roomId; 
        //do later
    }

    
    
}
