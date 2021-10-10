import mysql from "mysql";
import { connectionParameters } from "./secret"

let conn = mysql.createConnection(connectionParameters);
console.log('hi');
conn.query("SHOW TABLES;", function (err: any, rows: any, fields: any) {
    if (err) 
        throw err
    console.log('The solution is: ', rows[0].solution)
});

conn.end();