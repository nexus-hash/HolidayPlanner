import { request, response } from 'express';
import{app,sha256,tailwind} from './index.js';


const pool=require('./pool')

app.post('/login',function(response,request){
    pool.connect();
    pool.query("select count(*)from users where emailid=$1",[request.body.loginemail],function(err,res){
        if(res.rows.count==0){
            response.render("signup.ejs")
            return;
        }
        pool.query("select password from users where emailid=$1",[request.body.loginemail],function(error,respon){
            console.log(respon)
            if(respon.password==sha256(request.body.loginpassword)){
                response.redirect('./option.ejs');
                return;
            }
        })
    })
    console.log(request)
})