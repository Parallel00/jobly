"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Job {
  static async createJob(data) {
    const result = await db.query(
      `INSERT INTO jobs (title, salary, equity, company_handle)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [data.title, data.salary, data.equity, data.companyHandle]
    );
    return result.rows[0];
  }


  static async getAllJobs({ minSalary, hasEquity, title } = {}) {
    let query = `SELECT j.id,
                        j.title,
                        j.salary,
                        j.equity,
                        j.company_handle AS "companyHandle",
                        c.name AS "companyName"
                 FROM jobs j 
                 LEFT JOIN companies AS c ON c.handle = j.company_handle`;
    let conditions = [];
    let values = [];

    if (minSalary !== undefined) {
      values.push(minSalary);
      conditions.push(`salary >= $${values.length}`);
    }

    if (hasEquity === true) {
      conditions.push(`equity > 0`);
    }

    if (title !== undefined) {
      values.push(`%${title}%`);
      conditions.push(`title ILIKE $${values.length}`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY title";
    const jobsRes = await db.query(query, values);
    return jobsRes.rows;
  }

  static async getJobById(id) {
    const jobRes = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
       FROM jobs
       WHERE id = $1`, [id]
    );

    const job = jobRes.rows[0];
    if (!job) throw new NotFoundError(`No job: ${id}`);

    const companyRes = await db.query(
      `SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"
       FROM companies
       WHERE handle = $1`, [job.companyHandle]
    );

    delete job.companyHandle;
    job.company = companyRes.rows[0];

    return job;
  }


  static async updateJob(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {});
    const idVarIdx = "$" + (values.length + 1);

    const query = `UPDATE jobs 
                   SET ${setCols} 
                   WHERE id = ${idVarIdx} 
                   RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;
    const result = await db.query(query, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }


  static async deleteJob(id) {
    const result = await db.query(
      `DELETE
       FROM jobs
       WHERE id = $1
       RETURNING id`, [id]
    );

    const job = result.rows[0];
    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}

module.exports = Job;
