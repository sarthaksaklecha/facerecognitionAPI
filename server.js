const express = require('express');
var bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const app = express();
const cors = require('cors');
const knex = require('knex')({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : '8823',
    database : 'facerecognition'
  }
});

app.use(bodyParser.json());
app.use(cors());


app.post('/signin', (req,res)=>{
	let { email , password } = req.body;
	knex('signin').where('email','=',email).select('email', 'hash')
	.then(data=>{
		if(data.length){
			if(bcrypt.compareSync(password, data[0].hash)){
				knex('users').where('email','=', data[0].email).select('*').then(info=>res.json(info[0]))
		}
	}else{
		res.status(400).json('incorrect credentials')
	}	
})
})	

app.post('/register', (req,res)=>{
	let { name , email , password } = req.body;
	console.log(name,email,password);
	if(name && email && password){
		var hash = bcrypt.hashSync(password);
		knex.transaction(trx=> {
			trx.insert({
				hash: hash,
				email: email
			}).into('signin')
			.returning('email')
			.then((email2)=>{	
				return trx('users')
					.returning('*')
					.insert({
						email: email2[0],
						name:name,
						joined: new Date()
					})
					.then(response=>{
						console.log(response);
						res.json(response[0]);
					})
			})
		.then(trx.commit)
	    .catch(trx.rollback);
		})
	}else{
		res.status(400).json('enter valid details');
	}	
})



app.post('/profile/:id',(req,res)=>{
	const { id } = req.params;
	knex('users').where('id', id).select('*')
	.then((data)=> {
		if(data.length){
			res.json(data[0])
		}else{
			throw Error
		}
	})
	.catch((err)=>res.status(400).json("unable to get user"))
})

app.put('/image', (req,res)=> {
	let { id } = req.body;
	knex('users').where('id', id).select('entries').then((data)=>{
		let entries = data[0].entries;
		knex('users').where('id', id).update({
			entries: entries+1
			}, ['entries'])
		.then((final)=>res.json(final[0]))
	})
})



app.listen(3001, ()=>{
	console.log("app is running on 3000");
});
