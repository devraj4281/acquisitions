import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.get("/", (req, res) => {
    res.status(200).send("Hello World!");
});
app.post("/", (req, res) => {
    res.send("Hello World!");
});

app.put("/", (req, res) => {
    res.send("Hello World!");
});

app.delete("/", (req, res) => {
    res.send("Hello World!");
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send("Something broke!");
});

export default app;
