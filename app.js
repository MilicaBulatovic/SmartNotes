const express = require('express');
const app = express();
const { mongoose } = require('./db/mongoose');
const bodyParser = require('body-parser');

// Ucitavanje modela u MongoDb bazu
const { List, Note, User } = require('./db/models');
const jwt = require('jsonwebtoken');

/* MIDDLEWARE  */
// Ucitavanje middleware
app.use(bodyParser.json());

// CORS HEADERS MIDDLEWARE
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS, PUT, PATCH, DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token, x-refresh-token, _id");
    res.header(
        'Access-Control-Expose-Headers',
        'x-access-token, x-refresh-token'
    );
    next();
});

// provjera validnosti JWT tokena na zahtjev
let authenticate = (req, res, next) => {
    let token = req.header('x-access-token');

    // provjera JWT tokena
    jwt.verify(token, User.getJWTSecret(), (err, decoded) => {
        if (err) {
            // u slucaju greske
            // jwt token nije validan - * NE RADIMO AUTENTIFIKACIJU *
            res.status(401).send(err);
        } else {
            // jwt token je validan
            req.user_id = decoded._id;
            next();
        }
    });
}

// verifikacija osvjezenog tokena u middleware-u (koji ce verifikovati sesiju)
let verifySession = (req, res, next) => {
    // dohvatanje osvjezenog tokena na zahtjev iz zaglavlja
    let refreshToken = req.header('x-refresh-token');

    // dohvatanje _id na zahtjev iz zaglavlja
    let _id = req.header('_id');

    User.findByIdAndToken(_id, refreshToken).then((user) => {
        if (!user) {
            // u slucaju da korisnik nije pronadjen
            return Promise.reject({
                'error': 'User not found. Make sure that the refresh token and user id are correct'
            });
        }

        // u ovoj sekciju koda - korisnik je pronadjen
        // osvjezeni token postoji u bazi - moramo da provjerimo da li je istekao

        req.user_id = user._id;
        req.userObject = user;
        req.refreshToken = refreshToken;

        let isSessionValid = false;

        user.sessions.forEach((session) => {
            if (session.token === refreshToken) {
                // provjera da li je sesija istekla
                if (User.hasRefreshTokenExpired(session.expiresAt) === false) {
                    // osvjezen token nije istekao
                    isSessionValid = true;
                }
            }
        });

        if (isSessionValid) {
            // sesija je validna - pozivamo next() metodu za nastavak procesiranja web zahtjeva
            next();
        } else {
            // sesija nije validna
            return Promise.reject({
                'error': 'Refresh token has expired or the session is invalid'
            })
        }

    }).catch((e) => {
        res.status(401).send(e);
    })
}

/* END MIDDLEWARE  */

/* ROUTE HANDLERS */

/* LIST ROUTES */

/**
 VRACA SVE LISTE
 */
app.get('/lists', authenticate, (req, res) => {
    // vratiti liste koje pripadaju ulogovanom korisniku
    List.find({
        _userId: req.user_id
    }).then((lists) => {
        res.send(lists);
    }).catch((e) => {
        res.send(e);
    });
})

/**
 KREIRANJE LISTE
 */
app.post('/lists', authenticate, (req, res) => {
    // kreiranje nove liste i njeno vracanje korisniku sa id-jem
    let title = req.body.title;

    let newList = new List({
        title,
        _userId: req.user_id
    });
    newList.save().then((listDoc) => {
        // vraca citav dokument
        res.send(listDoc);
    })
});

/**
 UPDATEOVANJE LISTE
 */
app.patch('/lists/:id', authenticate, (req, res) => {
    
    List.findOneAndUpdate({ _id: req.params.id, _userId: req.user_id }, {
        $set: req.body
    }).then(() => {
        res.send({ 'message': 'updated successfully'});
    });
});

/**
BRISANJE LISTE
 */
app.delete('/lists/:id', authenticate, (req, res) => {
    // Kada zelimo da obrisemo odabranu listu (proslijedjen je id odabrane liste u URL-u)
    List.findOneAndRemove({
        _id: req.params.id,
        _userId: req.user_id
    }).then((removedListDoc) => {
        res.send(removedListDoc);

        // brisanje svih biljeski koje se nalaze u obrisanoj listi
        deleteNotesFromList(removedListDoc._id);
    })
});

/**
 * GET /lists/:listId/notes
 * Svrha: Dohvatanje svih biljeski u specificiranoj listi
 */
app.get('/lists/:listId/notes', authenticate, (req, res) => {
    // vracanje svih biljeski koje pripadaju specificiranoj listi (jedinstvenost liste po listId)
    Note.find({
        _listId: req.params.listId
    }).then((notes) => {
        res.send(notes);
    })
});

/**
 PRAVIMO NOVU BILJESKU U ODREDJENOJ LISTI
 */
app.post('/lists/:listId/notes', authenticate, (req, res) => {
    // Na osnovu id-ja gledamo dje cemo novu biljesku

    List.findOne({
        _id: req.params.listId,
        _userId: req.user_id
    }).then((list) => {
        if (list) {
            // validno, korisnik moze da kreira listu
            return true;
        }

        // ako je nedefinisan
        return false;
    }).then((canCreateNote) => {
        if (canCreateNote) {
            let newNote = new Note({
                title: req.body.title,
                _listId: req.params.listId
            });
            newNote.save().then((newNoteDoc) => {
                res.send(newNoteDoc);
            })
        } else {
            res.sendStatus(404);
        }
    })
})

/**
    UPDATEUJE biljesku
 */
app.patch('/lists/:listId/notes/:noteId', authenticate, (req, res) => {

    List.findOne({
        _id: req.params.listId,
        _userId: req.user_id
    }).then((list) => {
        if (list) {
            //pronadjen objekat liste
            return true;
        }

        // nedefinisan objekat
        return false;
    }).then((canUpdateNotes) => {
        if (canUpdateNotes) {
            // trenutno ulogovani korisnik moze da update-uje biljeske
            Note.findOneAndUpdate({
                _id: req.params.noteId,
                _listId: req.params.listId
            }, {
                    $set: req.body
                }
            ).then(() => {
                res.send({ message: 'Updated successfully.' })
            })
        } else {
            res.sendStatus(404);
        }
    })
});

/**
BRISEMO biljesku
 */
app.delete('/lists/:listId/notes/:noteId', authenticate, (req, res) => {

    List.findOne({
        _id: req.params.listId,
        _userId: req.user_id
    }).then((list) => {
        if (list) {
            // ako postoji objekat u listi 
            return true;
        }

        //ako je nedefinisan
        return false;
    }).then((canDeleteNotes) => {
        
        if (canDeleteNotes) {
            Note.findOneAndRemove({
                _id: req.params.noteId,
                _listId: req.params.listId
            }).then((removedNoteDoc) => {
                res.send(removedNoteDoc);
            })
        } else {
            res.sendStatus(404);
        }
    });
});

/* USER ROUTES */

/**
 * POST /users
 */
app.post('/users', (req, res) => {
    // User sign up

    let body = req.body;
    let newUser = new User(body);

    newUser.save().then(() => {
        return newUser.createSession();
    }).then((refreshToken) => {
        // uspijesno kreiranje sesije - vracanje osvijezenog tokena.
        // generisanje autorizovanog korisnickog tokena
        return newUser.generateAccessAuthToken().then((accessToken) => {
            // uspijesno prihvatanje autorizovanog tokena, sada vracamo objekat koji sadrzi autorizovan token
            return { accessToken, refreshToken }
        });
    }).then((authTokens) => {
        // Konstruisemo i saljemo odgovor korisniku koji sadrzi autorizovan token i korisnicki objekat u tijelu
        res.header('x-refresh-token', authTokens.refreshToken)
           .header('x-access-token', authTokens.accessToken)
           .send(newUser);
    }).catch((e) => {
        res.status(400).send(e);
    })
})

/**
 * POST /users/login

 */
 app.post('/users/login', (req, res) => {
    let email = req.body.email;
    let password = req.body.password;

    User.findByCredentials(email, password).then((user) => {
        return user.createSession().then((refreshToken) => {
            // uspijesno kreiranje sesije - vracamo osvijezen token.
            // generisanje autorizovanog korisnickog token
            return user.generateAccessAuthToken().then((accessToken) => {
                // uspijesno prihvatanje autorizovanog korisnickog tokena, sada vracamo koricniski objekat koji sadrzi autorizovan token
                return { accessToken, refreshToken }
            });
        }).then((authTokens) => {
            // Konstruisemo i saljemo odgovor korisniku koji sadrzi autorizovan token i korisnicki objekat u tijelu
            res.header('x-refresh-token', authTokens.refreshToken)
               .header('x-access-token', authTokens.accessToken)
               .send(user);
        })
    }).catch((e) => {
        res.status(400).send(e);
    });
})

/**
 * GET /users/me/access-token
  generisanje i vracanje prihvatnog token-a
 */
app.get('/users/me/access-token', verifySession, (req, res) => {
    // sada znamo da je korisnik/pozivalac autentifikovan, imamo user_id i koricniski objekat nam je dostupan
    req.userObject.generateAccessAuthToken().then((accessToken) => {
        res.header('x-access-token', accessToken).send({ accessToken });
    }).catch((e) => {
        res.status(400).send(e);
    });
})

/* POMOCNI METODI */
let deleteNotesFromList = (_listId) => {
    Note.deleteMany({
        _listId
    }).then(() => {
        console.log("Notes from " + _listId + " were deleted!");
    })
}

app.listen(3000, () => {
    console.log("Server is listening on port 3000");
})