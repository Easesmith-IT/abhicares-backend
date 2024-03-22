const swaggerAutogen = require('swagger-autogen')();

const doc ={
    info:{
        title:'Abhicares docs',
        description:'Abhicares docs',
    },

    host:'localhost:5000',
    schemes:['http']
}


const outputFile = './swagger-output.json';

const endpointsFiles = ['./routes/admin.js','./routes/shoppingRoutes.js']


swaggerAutogen(outputFile,endpointsFiles,doc).then(()=>{
    require('./server.js')
})