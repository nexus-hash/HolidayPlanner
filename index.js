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


/*
Rendering Login Page
*/
app.get('/login',(request,response)=>{
    response.render('login.ejs')
})

app.get('/forgotpassword',(request,response)=>{

})

/*
Rendering Signup Page
*/
app.get('/signup',(req,res)=>{
    res.render('signup.ejs')
});

/*
Rendering The HomePage or Option.ejs
*/
app.get('/option/package',(req,res)=>{
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

/*
Rendering PackageDetails Page
*/
app.get("/packagedetails",async function(req,res){
    var packagedata;
    var packagegetid = req.query.packageid;
    pool.connect();
    pool.query("select packagename,packagefare,packagedescription,totaldays from package where packageid=$1",[packagegetid],async function (erro, resp) {
            if (erro) {
                console.log(erro);
            }
            packagedata = resp.rows[0];
            pool.query("select tourid,tourname,tourdescription,placestobe,tourfare from tour where tourid in (select tourid from packagecontainstours where packageid = $1 );", [packagegetid],async function (err, respo) {
                if (err) {
                    console.log(err);
                }
                packagedata.tours = respo.rows;
                pool.query("select flightnumber,airlinename,departure,arrival,departuretime,arrivaltime,flightfare from flight where flightnumber in (select flightnumber from packagecontainsflights where packageid = $1 );", [packagegetid],async function (er, respon) {
                    if (er) {
                        console.log(er);
                    }
                    packagedata.flights = respon.rows;
                    res.render('packagedetails.ejs',packagedata);
                });
            });
        });
})

app.get('/packagedetails/book',(request,response)=>{
    var pkid=request.query.packageid;
    pool.connect();
    pool.query("insert into packagebooking(packageid, packagefromdate, paymentmethod, numberofpersons, bookingtime, username) values($1,$2,$3,$4,$5,$6);",[pkid,request.query.datebook,request.query.noofperson,getDateTime(),request.session.username],(err,res)=>{
        if(err){
            console.log(err);
            return;
        }
        //pool.query("select flightnumber from ")
    })
})

function getDateTime(){
    //let nowdate=Date.now();
    let date_ob = new Date();
    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    let hours = ("0"+(date_ob.getHours())).slice(-2);
    let minutes = ("0"+(date_ob.getMinutes())).slice(-2);
    let seconds = ("0"+(date_ob.getSeconds())).slice(-2); 
    var currdate=year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;
    return currdate;
}

/*
Rendering Tours Page
*/
app.get('/option/tours',function (req,res){
    pool.connect();
    pool.query("select  tourid, tourname,placefrom,duration,tourfare from tour",(err,resp)=>{
        var toursdata = {tours: resp.rows};
        res.render('touroption.ejs',toursdata);
    })
})

app.get('/tourdetails',(req,res)=>{
    var tourgetid=req.query.tourid;
    pool.connect();
    pool.query("",(err,resp)=>{
        
    });
})

/*
Rendering HotelSearch Page
*/
app.get('/option/hotel',(req,res)=>{
    pool.connect();
    pool.query("select cityname from statedetails where areacode in(select distinct Areacode from hotel)",(err,resp)=>{
        res.render('hotelsearch.ejs',{hotel:resp.rows});
    })
})

app.get('/searchhotel',(request,response)=>{
    pool.connect();
    pool.query("select hotelid,hotelname,hotellocation from hotel inner join statedetails on hotel.areacode = statedetails.areacode where cityname=$1",[request.query.loc],(err,res)=>{
        if(err){
            console.log(err)
        }
        for(let i=0;i<res.rows.length;i++){
        pool.query("select hoteldetailsid,availability,hotelfare from hoteldetailed where noofbeds=$1 and dateavail>=$2 and dateavail<=$3 and hotelid=$4",[request.query.totalbeds,request.query.checkin,request.query.checkout,res.rows[i].hotelid],(erro,resp)=>{
            if(erro){
                console.log(erro);
            }
            var minavail= 12223333;
            var hotelsearchdata;
            for(let j=0;j<resp.rows.length;j++){
                if(resp.rows[j].availability<minavail){
                    minavail=resp.rows[j].availability;
                }
            }
            res.rows[i].fare=resp.rows[0].hotelfare;
            if(minavail==0){
                res.rows[i].availability="Not Available";
            }
            else{
                res.rows[i].availability=minavail;
            }
            res.rows[i].checkin=request.query.checkin;
            res.rows[i].checkout=request.query.checkout;
        })
    }
    setTimeout(()=>{hotelsearchdata={hotel:res.rows};
    request.query={};
    console.log(hotelsearchdata);
    response.render('hoteloption.ejs',hotelsearchdata);
    },3000)
    
    })
})

app.get('/bookhotel',(request,response)=>{
    pool.connect();
})

app.get('/option/flight',(request,response)=>{
    pool.connect();
    pool.query("select distinct arrival,departure from flight",(err,res)=>{
        var airports={
            flight:
                res.rows
            
        }
        response.render('flightsearch.ejs',airports);
    })
})

app.get('/option/searchflight',(request,response)=>{
    var searchquery=request.query;
    pool.connect();
    pool.query("select flight.flightnumber,airlinename,departuretime,arrivaltime,flightfare,departure,arrival from flight inner join flightavailability on flight.flightnumber = flightavailability.flightnumber WHERE departure = $1 and arrival=$2 and dates=$3",[searchquery.dep,searchquery.arr,searchquery.traveldate],(err,res)=>{
        var searchresult={flight:res.rows};
        response.render('flightoption.ejs',searchresult)
    });
})


app.get('/userprofile',(req,res)=>{
    pool.connect();
    var userid=req.session.username;
    pool.query("select username,firstname,middlename,lastname,address,dob,phonenumber,emailid from users where username=$1",[userid],(error,response)=>{
        var userdetail={user:response.rows}
        res.render('profileview.ejs',userdetail)
        console.log(userdetail);
    })
})
app.get('/signout',(req,res)=>{
    if(req.session.username){
    res.render('signout.ejs');}
    else{
        res.redirect('/login')
    }
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
                response.redirect('/option/package');
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
                respos.redirect('/option/package');
                return;
            }
            else{
                console.log("Wrong Password")
            }
        })
    })
})


app.listen(config.port, () => {
    console.log(`App running on port ${config.port}.`)
});


module.exports={
    app: app
}

