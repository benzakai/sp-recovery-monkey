import express from "express";
import axios from "axios";
import { CronJob } from 'cron';
import * as dotenv from "dotenv";
dotenv.config();

const jobFirst = CronJob.from({
    cronTime: '*/30 * * * * *',
    onTick: async function () {
        const response = await axios.get(process.env.CRON_API_URL);
    },
    start: true,
    timeZone: 'America/Los_Angeles'
});

const jobSecond = CronJob.from({
    cronTime: '*/5 * * * *',
    onTick: async function () {
        const response = await axios.get(process.env.CRON_API_SECOND_URL);
    },
    start: true,
    timeZone: 'America/Los_Angeles'
});

const app = express();

app.get("/api/test", (req, res) => {
    res.send({ success: true });
});

app.listen(process.env.CRON_SERVER_PORT, () => console.log("Cron Job is Running"));
