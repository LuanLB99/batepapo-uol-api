import  express, { json }  from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from 'dotenv'
import dayjs from "dayjs";
import joi from "joi"
dotenv.config();


const mongoClient = new MongoClient(process.env.MONGO_URI);
const server = express();
server.use(cors());
server.use(express.json())

const userSchema = joi.object({
    nome: joi.string().required(),
})

const messageSchema = joi.object({
    to: joi.string().required(),
    type: joi.string().valid("message","private_message").required(),
    text:joi.string().required()
})


let db;

mongoClient.connect().then(() => {
    db = mongoClient.db("test")
});

server.post('/participants', async (req, res) => {
    const {name} = req.body 
    try {  
        const partExist = await db.collection("participantes").findOne({
        name:name
    }).then(user => user);

    if(partExist){
        res.status(409).send(console.log(partExist))
        return;
       }
    } catch (error) {
        console.log(error);
        res.send("deu erro aí, maluco!")
    }

    try {
        const validateuser =  userSchema.validate({name:name});
        if(!validateuser) {
            res.status(422).send({message:"Digite um usuário válido"})
            return;
        }
    } catch(err){};
    

   db.collection("participantes").insertOne({name:name,
                    lastStatus:Date.now()
})
db.collection("mensagens").insertOne(
    {from: name, to: 'Todos', text: 'entra na sala...', type: 'status', time: dayjs().format('HH:mm:ss')}  
)
        res.status(201).send("OK");
})

server.get('/participants', (req,res) => {
    db.collection("participantes").find().toArray().then(users => {
        res.send(users);
    })

})

server.post('/messages', async (req, res) => {
    const {to, text, type} = req.body;
    const {user:from} = req.headers;

    try {  
        const partExist = await db.collection("participantes").findOne({
        name:from
    }).then(user => user);

    if(!partExist){
        res.status(422).send({message: "Usuário não cadastrado!"})
        return;
       }
    } catch (error) {
        console.log(error);
        res.send("deu erro aí, maluco!")
    }

    try {
        const msgAproved = messageSchema.validate({to, text, type});
        if(!msgAproved){
            res.sendStatus(422)
            console.log('deu errado')
            return;
            }
            db.collection("mensagens").insertOne({
                to, text, type, from,time:dayjs().format('HH:mm:ss')
        })
    } catch (error){
        console.log(error);
        res.sendStatus(500);
    }

    res.status(201).send("OK");
})

server.get('/messages', async (req, res) => {
    const limit = parseInt(req.query.limit);
    const { user } = req.headers;

    if(!limit){
   const messages = await db.collection("mensagens").find().toArray();
   console.log("entrou no if",user)
   const filteredMessages = messages.filter(mensagens => mensagens.from === user || mensagens.to === user || mensagens.to === "Todos");
   res.send(filteredMessages);
   return
    }
    const messages = await db.collection("mensagens").find().toArray();
    console.log("entrou no if",user)
    const filteredMessages = messages.filter(mensagens => mensagens.from === user || mensagens.to === user || mensagens.to === "Todos");
    res.send(filteredMessages.slice(-limit));
    return
    
})


server.post('/status', async (req, res) => {
    const { user } = req.headers;

    try {  
        const partExist = await db.collection("participantes").findOne({
        name:user
    });

    if(!partExist){
        res.status(404).send({message: "Usuário não está logado!"})
        return;
       }  db.collection("participantes").updateOne({name:user},{
        $set: {
            lastStatus:Date.now()
        }
    });
    } 
    
    catch (error) {
        console.log(error);
        res.send("deu erro aí, maluco!")
    }

    res.status(200).send("ok")
})

setInterval(async () => {
    const participantes = await db.collection("participantes").find().toArray();
    const filteredParticipants = participantes.filter(participant => {
        const soma = Date.now()  -  participant.lastStatus;
        if(soma >= 10000 ) {
            db.collection( "mensagens" ).insertOne(
                { from : participant.name ,  to : 'Todos' ,  text : 'sai da sala...' , type : 'status' , time :dayjs( ).format( 'HH:mm:ss' )  }
                )
                db.collection( "participantes" ).deleteOne( { nome : participant.nome } )
            
        } else {
            console.log("entrou no else")
        }
    } )
}, 15000)

server.listen(5000, console.log("Listening on port 5000"))