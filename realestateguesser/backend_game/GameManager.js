import sqldb from "../mysql/mysql.js"

export default function (roomId, serverAdmin, maxPlayers, deleteRoomCallBack )
{
    //functions to send messages from the server from this object
    const serverMessage = (io, msg) =>
    {
        io.to("room-"+this.roomId).emit("chatMessage", 
        {
            user: "Server",
            msg: msg,
            admin: false,
            server: true
        })
    } 

    //converts seocnds to miliseconds     
    this.milis = (seconds) =>
    {
        return seconds*1000;
    }

    this.roomCleanUpTimeout; 

    this.roomDelTimeout = this.milis(30)

    this.serverAdmin = serverAdmin

    this.guessCount = 0; 

    this.maxPlayers = maxPlayers

   
    this.players = {};

    this.roomId = roomId; 

    //0: waiting for start, 1: guessing, 
    this.gameState = 0; 

    this.round = 0; 

    this.bufferTimeBetween = this.milis(10)

    this.acceptingGuesses = false; 

    this.estateDB = new sqldb()

    this.timerOb; 

    //this is what is being prompted in this room 
    this.targetEstate = {
        price: 0, 
        location: "",
        imageLinks: [],
        description:"", 
        points: 100,
        percErr: 0.5,
        estateid: -1 // 50 percent 
    }; 

    //settings in server which can be changed 
    this.settings = {
        maxRounds: 5,
        guessTime: this.milis(90),
        showLocation: true
    }

    //grabs the sql database and creates a target object
    this.createGuessOb = async () =>
    {
        let guessObj = await this.estateDB.getRandomLocation(this.targetEstate.estateid);
        

        //will need to check this with db 
        this.targetEstate.price = guessObj.price
        this.targetEstate.location = guessObj.location
        this.targetEstate.imageLinks = JSON.parse(guessObj.images); 
        this.targetEstate.description = guessObj.description
        this.targetEstate.estateid = guessObj.estateId
    }

    //calcualtes the winners based on the players connected to the game
    this.getWinners = () =>
    {
        let max = 0; 
        let winIds = [];  
        for(let i = 0; i < Object.keys(this.players).length; i++)
        {
            let id = Object.keys(this.players)[i]; 
            if(this.players[id].points > max)
            {
                winIds = [id];
                max = this.players[id].points;
            }
            else if(this.players[id].points == max)
            {
                winIds.push(id); 
            }
        }
        return winIds
    }

    //handles ending the game 
    this.endGame =(io)=>
    {
        if(serverAdmin)
        {
            this.gameState = 2; 
        }
        else
        {

            this.gameState = 0; 
        }
        let winners = this.getWinners();
        io.to("room-"+this.roomId).emit("gameEnd", {
            winners: winners,
        })
        if(serverAdmin)
        {
            serverMessage(io, "The game is over! Click the play again to return back to the home screen!")
        }
        else 
        {
            //Update the admin to display panel again
            for(let i = 0; i < Object.keys(this.players).length; i++)
            {
                if(this.players[Object.keys(this.players)[i]].admin)
                {
                    io.to(Object.keys(this.players)[i]).emit("showAdminPanel");
                    break; 
                }
            }
            serverMessage(io, "The game is over! Click the play again to return back to the home screen! The admin can also choose to start the game again!")
        }
    }

    //handles the ending of each round 
    this.endRound = (io) => 
    {
        this.guessCount = 0; 
        this.acceptingGuesses = false; 
        this.calculatePoints();
        io.to("room-"+this.roomId).emit("playerRoundUpdateEnd", 
        {
            players: this.players, 
            answer: this.targetEstate.price,
            bufferTimer: this.bufferTimeBetween/1000
            
        })
        serverMessage(io, `Guessing is over! The actual price is $${this.targetEstate.price} USD! `)
        
        if(this.round == this.settings.maxRounds) 
        {
            
            setTimeout(()=>
            {
                this.endGame(io)
            },this.bufferTimeBetween)
        }
        else 
        {
            //next Round
            setTimeout(()=>
            {
                this.startRound(io)
            }, this.bufferTimeBetween)
        }
    }

    //handles starting the round 
    this.startRound =async (io) =>
    {
        for(let i = 0; i < Object.keys(this.players).length; i++)
        {
            this.players[Object.keys(this.players)[i]].guess = -1;
        }
        await this.createGuessOb()
        this.round++; 
        this.acceptingGuesses = true; 
        io.to("room-"+this.roomId).emit("roundStart", 
        {
            guessTimer:this.settings.guessTime/1000, 
            round: this.round,
            images: this.targetEstate.imageLinks,
            location: (this.settings.showLocation) ? this.targetEstate.location:null,
            description: this.targetEstate.description
        })
        serverMessage(io, `Round ${this.round} just started! Give your best guess of the real estate's value before time is up!`)
        //do this or smth
        this.timerOb = setTimeout(()=>
        {
            this.endRound(io)
        }, this.settings.guessTime); 
    }

    //using each of the guesses the points will be calculated by how far it is from the target price with a 50% error
    this.calculatePoints = () =>
    {
        //how off they can be for points
        let rangeError = this.targetEstate.price*this.targetEstate.percErr; 
        for(let i = 0; i < Object.keys(this.players).length; i++)
        {
            let pGuess = this.players[Object.keys(this.players)[i]].guess 

            //console.log(pGuess)
            //no points awarded
            if(pGuess == -1) continue; 

            //thid is returrning null idk how
            
            let pts = Math.round(100 * (rangeError- Math.min( rangeError, Math.abs( this.targetEstate.price - pGuess )))/rangeError); 

            //or maybe here
            this.players[Object.keys(this.players)[i]].points += pts;  
        }



    }

    //handles guessing the price and adding to the player in the room 
    this.guessPrice = (socketId, price, io) =>
    {
        if(isNaN(price)) return; 
        if(price < 0 ) return; 
        if(this.players[socketId].guess != -1) return; 
        this.players[socketId].guess = price; 
        this.guessCount++; 

        serverMessage(io, `${this.players[socketId].name} thinks the value of property is $${price}`)
        if(this.guessCount == Object.keys(this.players).length)
        {
            clearInterval(this.timerOb)

            this.endRound(io)
        }
        
  }
     
//starts the game loop from start round, to end round, and loop using inteverals until the rounds is met
    this.startGame = async (io) =>
    {

        if(this.gameState != 0 ) return; 
        await this.createGuessOb()

        if(this.gameState == 1 || Object.keys(this.players).length == 0) return; 
        this.gameState = 1; 
        for(let i = 0; i < Object.keys(this.players).length; i++)
        {
            this.players[Object.keys(this.players)[i]].points = 0;
        }
        //this.createGuessOb()
        io.to("room-"+this.roomId).emit("resetPoints")
        this.round = 0; 
        this.startRound(io);    

    }
//handles changing settings 
    this.changeSettings = (socketid,setSettings) =>
    {

        setSettings.maxRounds = parseInt(setSettings.maxRounds)
        setSettings.guessTime = parseInt(setSettings.guessTime)
        if(!this.players[socketid].admin) return; 
   
        if(setSettings.guessTime > 300 || setSettings.guessTime < 15 || setSettings.maxRounds < 1 || setSettings.maxRounds > 20)

        this.settings.maxRounds = setSettings.maxRounds
        this.settings.showLocation = setSettings.showLocation
        this.settings.guessTime = this.milis(setSettings.guessTime)
    }
//adds a player object to the current players connected to the game room 
    this.addPlayer = (socketId, name ) =>
    {
        if(Object.keys(this.players).length == this.maxPlayers )
        {
            return {error: true, msg: "Game is full!"}; 
        }
        if(this.gameState == 1)
        {
            return {error:true, msg: "Game is already in motion"}
        }
        clearInterval(this.roomCleanUpTimeout)
        let admin = (Object.keys(this.players).length == 0 && !serverAdmin) ? true : false 
        this.players[socketId] = {
            name:name, 
            points:0,  
            admin:admin, 
            guess:-1
        }; 
        
        return true; 
    }

    //if a player leaves remove them from player dictionary 
    this.removePlayer = (socketID, socket) =>
    {
        var needNewAdmin = (this.players[socketID].admin)
        
        delete this.players[socketID]
        if(needNewAdmin && Object.keys(this.players).length > 0)
        {
            this.players[Object.keys(this.players)[0]].admin = true; 
            return true;
        }
        else if(Object.keys(this.players).length > 0)
        {
            console.log("deleting room in 30s")
            this.roomCleanUpTimeout = setTimeout(deleteRoomCallBack, this.roomDelTimeout); 
        }
        return false;
    }

}
