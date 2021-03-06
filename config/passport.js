const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const debug = require('debug');

const log = debug('guess:Authentication');

const assert = require('assert');

const bcrypt = require('bcrypt');

const db = require('./db');

// Local function defs
async function findByUsername(username, cb) {
  try {
    log('finding username...');
    const user = await db.findByUsername(username);
    log(user);
    return cb(null, user);
  } catch (err) {
    log(err);
  }
}

async function findByUserId(id) {
  try {
    log('lookin by id big dawg');
    const user = await db.findById(id);
    return user;
  } catch (err) {
    log(err);
  }
}

/*
 * Match hash from DB with hash performed and password passed by user
 */
async function verifyPassword(user, password) {
  try {
    log('at verifyPw');
    const match = await bcrypt.compare(password, user.hashedPw);
    return match;
  } catch (err) {
    log(`${err.stack}`);
  }
}

// Configure the local strategy for use by Passport.
//
const initPassport = function () {
  passport.serializeUser(function (user, cb) {
    log(user._id);
    cb(null, user._id);
  });

  passport.deserializeUser(async function (id, done) {
    const userFound = await findByUserId(id);
    log('user found in session...');
    done(null, userFound);
  });
  passport.use(
    'local',
    new LocalStrategy({ passReqToCallback: true }, function (
      req,
      username,
      password,
      done
    ) {
      log('Using LocalStrategy...');
      findByUsername(username, (err, user) => {
        log('trying to authenicate..');
        if (err) {
          return done(err);
        }
        if (!user) {
          return done(null, false, {
            message: `Unknown user ${username}`,
          });
        }
        if (!verifyPassword(user, password)) {
          return done(null, false, { message: 'Invalid Password' });
        }
        return done(null, user);
      });
    })
  );
  return passport;
};

function getPassport() {
  assert.ok(passport, 'Passport not working');
  log('Passport got');
  return passport;
}

module.exports = { initialize: initPassport, getPassport };
