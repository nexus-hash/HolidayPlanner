const { request, response } = require('express');

const Pool=require('pg').Pool
const pool=new Pool({
           
        user     : 'postgres',        
        host     : 'localhost',        
        database : 'tourbookingportal',        
        password : 'dbmsproject2020',        
        port     : 5444,
})

module.exports=pool;