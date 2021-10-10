import mysql from "mysql2";
import { connectionParameters } from "./secret"

let conn = mysql.createConnection(connectionParameters);

conn.end();