import mysql from "mysql"

export default function() {
    this.sqlcon = mysql.createConnection({
        host: process.env.SQLHOST,
        user: process.env.SQLUSER,
        password: process.env.SQLPWD,
        database: process.env.DATABASENAME
    });

    this.sqlcon.connect(); 
      
    this.getRowCount = async ()=>
    {
      this.sqlcon.query("SELECT COUNT(estateId) FROM estateData", async(error, results, fields) =>
      {
        if(error) throw error; 

        console.log("Length is", results[0]["COUNT(estateId)"])
        
        this.estateDataCount = results[0]["COUNT(estateId)"]; 
      })
    }

    //gets how many rows there are to calcuakte a random number, NICE
    this.estateDataCount; 
    this.getRowCount(this.estateDataCount)


    this.getRandomLocation = async (exclude = -1) => 
    {

      let randomNumber = Math.ceil(Math.random()*this.estateDataCount)
      if(randomNumber == exclude)
      {
        randomNumber = 0;
      }

      return new Promise((resolve, reject) =>
      {
        this.sqlcon.query(`SELECT * FROM estateData WHERE estateId=${randomNumber}`, async(error, results, fields) =>
        {
          if(error) reject(error); 
  
          //console.log("Length is", results[0]["COUNT(estateId)"])
          return resolve(JSON.parse(JSON.stringify(results[0])))
        })
      })
    }

};