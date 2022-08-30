import  express, { json }  from "express";
import cors from "cors";
import dayjs from "dayjs";

const server = express();
server.use(cors());
server.use(express.json())

let participant = ''
const participants = [];
const mensagens = [];

server.post('/participants', (req, res) => {
    const {nome} = req.body 

    if(nome === '' || !nome) {
        res.status(422).send({message:"Digite um usuário válido"})
        return;
    }
   const partExist = participants.find((participant) => nome === participant.name);

   if(partExist){
    res.status(409).send({message: "Usuário já existente!"})
    return;
   }
   participant = nome;
   participants.push({name:nome,
                    lastStatus:Date.now()
})
        res.status(201).send(console.log(participants));
})

server.get('/participants', (req,res) => {
    res.send(participants);
})

server.post('/messages', (req, res) => {
    const {to, text, type} = req.body;
    const {user:from} = req.headers;

    if(to === '' || text === '') {
        res.status(422).send({message: "Texto ou destinatário vazios!"})
    return;
    }

    if(type != 'message' && type != 'private_message') {
        res.status(422).send({message: "Tipo da mensagem incorreta!"})
    return;
    }

    const partExist = participants.find((participant) => from === participant.name);
    if(!partExist){
        res.status(422).send({message: "Usuário não cadastrado!"})
    }


    mensagens.push({to, text, type, from,time:dayjs()})    


    res.status(201).send(mensagens);
})

server.get('/messages/:limit', (req, res) => {
    const limit = req.params.limit;

    if(!limit){
        res.send(mensagens)
        return;
    }

    const mymessages = mensagens.filter((mensagem) => mensagem.from === participant || mensagem.to === participant)
    res.send(mymessages)
})

server.listen(5000, console.log("Listening on port 5000"))