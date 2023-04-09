import sqldb from "../mysql/mysql.js"

export default function (roomId )
{

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
    this.milis = (seconds) =>
    {
        return seconds*1000;
    }
    this.players = {};

    this.roomId = roomId; 

    //0: waiting for start, 1: guessing, 
    this.gameState = 0; 

    this.round = 0; 

    this.bufferTimeBetween = this.milis(5)

    this.acceptingGuesses = false; 

    this.estateDB = new sqldb()

    //might need to handle currency

    this.targetEstate = {
        price: 0, 
        location: "",
        imageLinks: [],
        description:"", 
        points: 100,
        percErr: 0.5 // 50 percent 
    }; 

    

    //default server settings
    this.settings = {
        maxRounds: 10,
        guessTime: this.milis(90),
        showLocation: true
    }


    this.createGuessOb = async () =>
    {
        let guessObj = await this.estateDB.getRandomLocation();
        

        //will need to check this with db 
        this.targetEstate.price = guessObj.price
        this.targetEstate.location = guessObj.location
        this.targetEstate.imageLinks = JSON.parse(guessObj.images); 
        this.targetEstate.description = guessObj.description
    }

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
            }
            else if(this.players[id].points == max)
            {
                winIds.push(id); 
            }
        }
        return winIds
    }

    this.endGame =(io)=>
    {
        let winners = this.getWinners();
        io.to("room-"+this.roomId).emit("gameEnd", {
            winners: winners
        })
    }

    this.endRound = (io) => 
    {
        console.log("MEOW")
        this.acceptingGuesses = false; 
        this.calculatePoints();
        io.to("room-"+this.roomId).emit("playerRoundUpdateEnd", 
        {
            players: this.players, 
            answer: this.targetEstate.price,
            bufferTimer: this.bufferTimeBetween/1000
            
        })
        serverMessage(io, `Guessing time is over! The actual price is $${this.targetEstate.price} USD! `)
        if(this.round == this.settings.maxRounds) 
        {
            
            setTimeout(this.endGame,this.bufferTimeBetween)
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
        setTimeout(()=>
        {
            this.endRound(io)
        }, this.settings.guessTime); 
    }

    this.calculatePoints = () =>
    {
        //how off they can be for points
        let rangeError = this.targetEstate.price*this.settings.percErr; 
        for(let i = 0; i < Object.keys(this.players).length; i++)
        {
            let pGuess = this.players[Object.keys(this.players)[i]].guess 

            //no points awarded
            if(pGuess == -1) continue; 

            let pts = 100 * (rangeError- Math.min( rangeError, Math.abs( this.targetEstate.price - pGuess )))/rangeError; 

            this.players[Object.keys(this.players)[i]].points += pts;  
        }



    }

    this.guessPrice = (socketId, price) =>
    {
        if(isNaN(price)) return; 
        if(price < 0 ) return; 
        this.players[socketId].guess = price; 

        //some emit thingy 
    }
     

    this.startGame = async (io) =>
    {

        // console.log(this.estateDB.estateDataCount)


        // //kinda scared LOL
        // return; 


        await this.createGuessOb()
        console.log(this.targetEstate)

        if(this.gameState == 1 || Object.keys(this.players).length == 0) return; 
        this.gameState = 1; 
        for(let i = 0; i < Object.keys(this.players).length; i++)
        {
            this.players[Object.keys(this.players)[i]].points = 0;
        }
        //this.createGuessOb()
        io.to("room-"+this.roomId).emit("resetPoints")
        this.startRound(io); 
        

    }

    this.changeSettings = (socketid,setSettings) =>
    {
        if(!this.players[socketid].admin) return; 
   
        if(setSettings.guessTime > 300 || setSettings.guessTime < 15 || setSettings.maxRounds < 1 || setSettings.maxRounds > 10)

        this.settings.maxRounds = setSettings.maxRounds
        this.settings.showLocation = setSettings.showLocation
        this.settings.guessTime = this.milis(setSettings.guessTime)
    }

    this.addPlayer = (socketId, name ) =>
    {
        let admin = (Object.keys(this.players).length == 0) ? true : false 
        this.players[socketId] = {
            name:name, 
            points:0,  
            admin:admin, guess:-1
        }; 
        
    }
    
    this.removePlayer = (socketID, socket) =>
    {
        var needNewAdmin = (this.players[socketID].admin)
        
        delete this.players[socketID]
        if(needNewAdmin && Object.keys(this.players).length > 0)
        {
            this.players[Object.keys(this.players)[0]].admin = true; 
            return true;
        }
        return false;
    }

}
