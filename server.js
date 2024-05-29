if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const mysql = require('mysql')

const initializePassport = require('./passport-config')
initializePassport(
    passport,
    async (email) => {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM users WHERE email = ?', [email], (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results[0]); // returns the first row found or undefined if no user is found
                }
            });
        });
    },
    async (id) => {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM users WHERE id = ?', [id], (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results[0]); // returns the first row found or undefined if no user is found
                }
            });
        });
    }
);


app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

//////////////////////////////////////////////////////
// CREACION DE BASE DE DATOS /////////////////////////
//////////////////////////////////////////////////////
const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE
})

db.connect((error)=>{
  if(error){
    console.log(error)
  }else{
    console.log("Conectado a Mysql..")
  }
})
/////////////////////////////////////////////////////

//////////////////////////////////////////////////////
// CONEXION A BASE DE DATOS fulbo ///////////
//////////////////////////////////////////////////////
const dbFulbo = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'fulbo'
  })
  
  dbFulbo.connect((error)=>{
    if(error){
      console.log(error)
    }else{
      console.log("Conectado a fulbo...")
    }
  })

// Nueva ruta para obtener los datos de la base de datos fulbo
app.get('/datos-fulbo', (req, res) => {
    const type = req.query.type;
    let sql;

    switch (type) {
        case 'commonResults':
            sql = `
                SELECT 
                    LEAST(home_score, away_score) AS min_score,
                    GREATEST(home_score, away_score) AS max_score,
                    CONCAT(LEAST(home_score, away_score), '-', GREATEST(home_score, away_score)) as result, 
                    COUNT(*) as count
                FROM results
                GROUP BY min_score, max_score
                ORDER BY count DESC
                LIMIT 10
            `;
            break;
        case 'commonMatches':
            sql = `
                SELECT 
                    CONCAT(
                        LEAST(home_team, away_team), 
                        ' vs ', 
                        GREATEST(home_team, away_team)
                    ) as match_up, 
                    COUNT(*) as count
                FROM results
                GROUP BY match_up
                ORDER BY count DESC
                LIMIT 10
            `;
            break;
        case 'matchesByCity':
        default:
            sql = `
                SELECT city, COUNT(*) as count
                FROM results
                GROUP BY city
                ORDER BY count DESC
                LIMIT 10
            `;
            break;
    }

    dbFulbo.query(sql, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});




// DEFINIMOS LAS RUTAS (./Routes/pages.js)///////////
app.use('/', require('./routes/pages'))
app.use('/register', require('./routes/pages'))
app.use('/login', require('./routes/pages'))


app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        const newUser = {
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        }
        // Insertar el nuevo usuario en la base de datos
        db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', 
            [newUser.name, newUser.email, newUser.password],
            (error, results) => {
                if (error) {
                    console.log(error);
                    res.redirect('/register');
                } else {
                    res.redirect('/login');
                }
            });
    } catch {
        res.redirect('/register');
    }
});

app.delete('/logout', (req, res, next) => {
    req.logOut((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/login');
    });
});

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }

    res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/')
    }
    next()
}

app.listen(3000)

app.use(express.static('public'))


