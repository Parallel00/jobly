"use strict";

const db = require("../db.js");
const bcrypt = require("bcrypt");
const { BadRequestError, NotFoundError } = require("../expressError");

const BCRYPT_WORK_FACTOR = 10;

/** User of the site. */

class User {
  /** Register user with data. Returns new user data. */
  static async register({ username, firstName, lastName, password, email, isAdmin }) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
      `INSERT INTO users
       (username, first_name, last_name, password, email, is_admin)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING username, first_name AS "firstName", last_name AS "lastName", email, is_admin AS "isAdmin"`,
      [username, firstName, lastName, hashedPassword, email, isAdmin]
    );

    return result.rows[0];
  }

  /** Authenticate user with username and password. Returns user data. */
  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT password, username, first_name AS "firstName",
              last_name AS "lastName", email, is_admin AS "isAdmin"
       FROM users
       WHERE username = $1`,
      [username]
    );

    const user = result.rows[0];

    if (!user) throw new BadRequestError("Invalid username/password");

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new BadRequestError("Invalid username/password");

    delete user.password; // remove password from the response
    return user;
  }

  /** Find all users. Returns array of users. */
  static async findAll() {
    const result = await db.query(
      `SELECT username, first_name AS "firstName", last_name AS "lastName", email, is_admin AS "isAdmin"
       FROM users`
    );
    return result.rows;
  }

  /** Get user by username. Returns user data. */
  static async get(username) {
    const result = await db.query(
      `SELECT username, first_name AS "firstName", last_name AS "lastName", email, is_admin AS "isAdmin"
       FROM users
       WHERE username = $1`,
      [username]
    );

    const user = result.rows[0];
    if (!user) throw new NotFoundError(`No user: ${username}`);
    return user;
  }

  /** Update user data. Returns updated user data. */
  static async update(username, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {});
    const usernameVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE users 
                      SET ${setCols} 
                      WHERE username = ${usernameVarIdx} 
                      RETURNING username, first_name AS "firstName", last_name AS "lastName", email, is_admin AS "isAdmin"`;
    const result = await db.query(querySql, [...values, username]);
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);
    return user;
  }

  /** Remove user by username. Returns undefined. */
  static async remove(username) {
    const result = await db.query(
      `DELETE FROM users 
       WHERE username = $1 
       RETURNING username`,
      [username]
    );

    const user = result.rows[0];
    if (!user) throw new NotFoundError(`No user: ${username}`);
  }
}

module.exports = User;
