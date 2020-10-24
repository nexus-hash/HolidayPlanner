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

const clientsession=require('client-sessions');
const session=require('express-session');


app.use(express.static('static/public'));

app.use(bodyParser.json())
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
)

app.use(cors());

app.use(session({
    secret:"DBMS",
    resave: false,
    saveUninitialized: true
}))


app.get('/login',(request,response)=>{
    response.render('login.ejs')
})
app.get('/signup',(req,res)=>{
    res.render('signup.ejs')
});
app.get('/option',(req,res)=>{
    pool.query("select packageid, packagename, totaldays, places, packagefare from package;",(error,response)=>{
        if(error){
            console.log(error)
            return;
        }
        pkg = {package: response.rows};
        //console.log(pkg)
        /*if(req.session.username){
        res.render('option.ejs',pkg)}
        else{
            res.redirect('/login');
        }*/
        res.render('option.ejs',pkg);
    })
    
})

var pmh={
    packagename:"",
    packagefare:"",
    packagedescription:"",
    totaldays:"",
    tours:
    [
        {
            tourid:"",
            tourname:"",
            duration:"",
            placesto:""
        },
        {
            tourid:"",
            tourname:"",
            duration:"",
            placesto:""
        }
    ],
    flights:
    [
        {
        flightnumber:"",
        airlinename:"",
        departure:"",
        arrival:"",
        departuretime:"",
        arrivaltime:"",
        filghtfare:""
        },
        {
            flightnumber:"",
            airlinename:"",
            departure:"",
            arrival:"",
            departuretime:"",
            arrivaltime:"",
            filghtfare:""
            }
    ]
}

/*app.get("/packagedetails",(req,res)=>{
    res.render('',pdetails)
})*/
var packagen;
app.get("/packagedetails",(req,res)=>{
    var packagedata;
    pool.connect();
    pool.query("select packagename,packagefare,packagedescription,totaldays from package where packageid=$1",[packagen],(erro,resp)=>{
        if(erro){
            console.log(erro)
        }
        console.log(packagen);
        packagedata=resp.rows[0];
        pool.query("select tourid,tourname,tourdescription,placestobe,tourfare from tour where tourid in (select tourid from packagecontainstours where packageid = $1 );",[packagen],(err,respo)=>{
            if(err){
                console.log(err)
            }
            packagedata.tours=respo.rows;
            console.log(packagedata);
            pool.query("select flightnumber,airlinename,departure,arrival,departuretime,arrivaltime,flightfare from flight where flightnumber in (select flightnumber from packagecontainsflights where packageid = $1 );",[packagen],(er,respon)=>{
                if(er){
                    console.log(er);
                }
                packagedata.flights=respon.rows;
                console.log(packagedata);
            })
        })
    });
    res.render("packagedetails.ejs",pmh)
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
                res.redirect('/login')
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

app.post("/login",(reque,respos)=>{
    pool.connect();
    pool.query("select count(*)from users where emailid=$1",[reque.body.loginemail],function(err,res){
        if(res.rows[0].count==0){
            respos.redirect("/signup")
            return;
        }
        pool.query("select password,username from users where emailid=$1",[reque.body.loginemail],function(error,respon){
            if(respon.rows[0].password==sha256(reque.body.loginpassword)){
                reque.session.username=respon.rows[0].username.toString();
                respos.redirect('/option');
                return;
            }
        })
    })
})

app.post("/packagedetails",(request,response)=>{
    console.log(request.body.packageid);
    packagen=request.body.packageid;
    response.redirect('/packagedetails');
})


app.listen(config.port, () => {
    console.log(`App running on port ${config.port}.`)
});


module.exports={
    app: app
}

