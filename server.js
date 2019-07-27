require("dotenv").config() // create env file and create token variable with uuid in string. This is for example, actual api validation should generate multiple token #s. 
const express = require("express")
const morgan = require("morgan")
const helmet = require('helmet')
const cors = require("cors")
const POKEDEX = require("./pokedex.json")
console.log(process.env.API_TOKEN)
const app = express();

// use NODE_ENV, an environmental variable, to have code adapt to its environment
// NODE_ENV determines if application is running in production or some other environment. 
const morganSetting = process.env.NODE_ENV === "production" ? "tiny" : "common"
app.use(morgan(morganSetting)) // for deployed servers, use short or tiny



// this must be placed before cors. 
app.use(helmet()) // protects against targeted attack. Hides x-powered-by in dev console of header in request list
app.use(cors())

// validation middleware goes right after morgan. 
// Like a factory conveyor belt before split
// Without this placement, would have to create a middleware
    // for each of the requests, as the conveoyr belt would have
    // been split already going down to each endpoint. The next() instructs
    // req,res to move onto next station. W/O, would stop. 
app.use(function validateBearerToken(req, res, next){
    
    const apiToken = process.env.API_TOKEN
    // run ndb server.js with debugger for this function. 
    // type in console req.get("Authorization...or whatever you named it").split(" ")[1] to get second value of array, 
    // which is the token itself.
    // this bearerToken is the user's token
    const authToken = req.get("Authorization") //.split(" ")[1]
    // apiToken is what you allow. Compare the two to validate. 
    console.log("validate bearer token middleware")
    // Checking for headers & comparing tokens: Need to check 
    // for header because if no header, then nothing to split() in [1] position
    // so took off split() above in req.get("authorization")
    // only do it if header is present. See below: 
    if (!authToken || authToken.split(' ')[1] !== apiToken) {
        return res.status(401).json({ error: 'Unauthorized request' })
    }

    next()
})


const validTypes = [`Bug`, `Dark`, `Dragon`, `Electric`, `Fairy`, `Fighting`, `Fire`, `Flying`, `Ghost`, `Grass`, `Ground`, `Ice`, `Normal`, `Poison`, `Psychic`, `Rock`, `Steel`, `Water`]
function handleGetTypes(req,res) {
    res.json(validTypes);
}

// Validation must occur before all callback handlers. handlers are middleware. 
app.get("/types", handleGetTypes)

app.get("/pokemon", function handleGetPokemon (req,res) {
    let response = POKEDEX.pokemon // in pokemon array, but POKEDEX is large object
    if(req.query.name) {
        response = response.filter(pokemon => 
        // this below changes the data you are looking at to lowercase. 
        // Then it compares with a lowercase version of the type query. 
            pokemon.name.toLowerCase().includes(req.query.name.toLowerCase())
        )
    }
    // Consider that we don't ever return only the name query. 
    // Since the type query is required, the response should come only from the type
    // query sort. 
    // Types are usually in a select element. No need to mess with its casing. 
    // the casing in the select element of HTML. 
    if(req.query.type) {
        response = response.filter(pokemon => pokemon.type.includes(req.query.type))
    }
    res.json(response)
});

// when there is an error, the server often returns/logs valuable info. This 
//  prevents servers from logging that info to users -- info like API TOKENS. 
app.use((error, req, res, next) => {
    let response 
    if(process.env.NODE_ENV === "production") {
        response = {error: {message: "server error"}}
    } else {
        response = {error}
    }
    res.status(500).json(response)
})

// Heroku assigns a PORT to your app. App must use 
// Heroku's PORT, which is in the environmental variable
// under process.env.PORT. Use below condition if no env port var. 
const PORT = process.env.PORT || 8000; 

app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`)
})

// another UUID: 7df8b76e-6fa3-410b-8b20-8ecc511b9fe7. Use later in env
// the API TOKEN you used in production should be different from the one 
// used in deployment. This will be production API TOKEN


// NOTES about offsite code: 
// Create a Procfile. (it has no extension)
// Note: PROCFILE is in this folder. This is used to separate production
//start scripts from the npm. You don't need it, but it is good to keep your 
// npm scripts in the package.json file separate from the production,
// just so there is more control over. 

// In package.json file, ensure that you have specified the exact 
// version of node you used for production. This way, Heroku will 
// use that version when it checks, instead of a different version of node, which could cause 
// issues. 

// Run npm audit before production. Ensures all the things you installed
// indeed installed properly. npm audit --fix if there are errors. 