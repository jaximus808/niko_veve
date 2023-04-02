export default function ()
{
    this.players = {};

    //0: waiting for start, 1: guessing, 
    this.gameState = 0; 

    this.addPlayer = (socketId, name, ) =>
    {
        let admin = (Object.keys(this.players).length == 0) ? true : false 
        this.players[socketId] = {name:name, points:0,  admin:admin}; 
        console.log(this.players)
    }
    
    this.removePlayer = (socketID, socket) =>
    {
        var needNewAdmin = (this.players[socketID].admin)
        
        console.log("yggg")
        delete this.players[socketID]
        if(needNewAdmin && Object.keys(this.players).length > 0)
        {
            this.players[Object.keys(this.players)[0]].admin = true; 
            console.log("hyuff")
            return true;
        }
        return false;
    }

}
