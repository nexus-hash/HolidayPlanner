const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const config = require('./config');
const cors = require('cors');
const { request, response } = require('express');
const tailwind = require('tailwindcss');
const sha256 = require('sha256');

const pool = require('./pool');
const { Connection } = require('pg');
const { connect } = require('./pool');


app.use(express.static('static/public'));

app.use(bodyParser.json())
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
)
app.use(cors());

app.get('/login',(request,response)=>{
    response.render('login.ejs')
})
app.get('/signup',(req,res)=>{
    res.render('signup.ejs')
});
app.get('/option',(req,res)=>{
    res.render('option.ejs')
})


app.post('/signup',(request,response)=>{
    if(request.body.password==request.body.conpassword){
        console.log(request);
        pool.connect().then(()=>console.log("Connected")).catch((e)=>console.log(e)).finally(()=>console.log);
        pool.query("select count(*) from users where emailid=$1",[request.body.email],function(err,res){
            if(err){
                console.log(err);
                return;
            }
            if(res.rows.count==1){
                res.render('login.ejs')
                return;
            }
            pool.query("insert into users(password, firstname, middlename, lastname, address, dob, phonenumber, emailid) values ($1,$2,$3,$4,$5,$6,$7,$8)",[sha256(request.body.password),request.body.firstname,request.body.middlename,request.body.lastname,request.body.Address,request.body.dob,request.body.phno,request.body.email],function(error,respo){
                if(error){
                    console.log(error)
                    return ;
                }
                response.redirect('/option');
            })
        })
    }
});

app.listen(config.port, () => {
    console.log(`App running on port ${config.port}.`)
});

export{app,sha256,tailwind};