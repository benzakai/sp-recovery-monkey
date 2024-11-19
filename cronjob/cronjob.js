import express from "express";
import axios from "axios";
import { CronJob } from 'cron';
import * as dotenv from "dotenv";
dotenv.config();

const job = CronJob.from({
    cronTime: '*/10 * * * * *',
    onTick: async function () {
        console.log('You will see this message every 10 seconds');
        const response = await axios.get(process.env.CRON_API_URL);
        console.log("response", response.data);
    },
    start: true,
    timeZone: 'America/Los_Angeles'
});

const app = express();

app.get("/api/test", (req, res) => {
    res.send({ success: true });
});

app.listen(process.env.CRON_SERVER_PORT, () => console.log("Cron Job is Running"));