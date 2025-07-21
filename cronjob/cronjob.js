import express from "express";
import axios from "axios";
import { CronJob } from 'cron';
import * as dotenv from "dotenv";
dotenv.config();

const jobFirst = CronJob.from({
    cronTime: '* * * * *',
    onTick: async function () {
        console.log("CRON JOB STARTING jobFirst cron/execute", new Date());
        const response = await axios.get(process.env.CRON_API_URL);
    },
    start: true,
    timeZone: 'America/Los_Angeles'
});

const jobSecond = CronJob.from({
    cronTime: '*/15 * * * *',
    onTick: async function () {
        console.log("CRON JOB STARTING jobSecond for withoutphone/execute ", new Date());
        const response = await axios.get(process.env.CRON_API_SECOND_URL);
    },
    start: true,
    timeZone: 'America/Los_Angeles'
});

const jobThird = CronJob.from({
    cronTime: '15 0 * * *',  // This runs at 12:15 AM every day
    onTick: async function () {
        console.log("CRON JOB STARTING jobThird for storeStats/execute", new Date());
        const response = await axios.get(process.env.CRON_API_THIRD_URL);
    },
    start: true,
    timeZone: 'America/Los_Angeles'
});

const jobFourth = CronJob.from({
    cronTime: '0 6,12,18,23 * * *',  // This Runs at 6 AM, 12 PM, 6 PM, and 11:59 PM
    onTick: async function () {
        console.log("CRON JOB STARTING jobFourth for cron/orderTagging", new Date());
        const response = await axios.get(process.env.CRON_API_FOURTH_URL);
    },
    start: true,
    timeZone: 'America/Los_Angeles'
});

const jobFifth = CronJob.from({
    cronTime: '0 0 1,6,11,16,21,25 * *',  // runs on the 1st, 6th, 11th, 16th, 21st, and 25th at midnight
    onTick: async function () {
        console.log("CRON JOB STARTING jobFifth for cron/uninstall-planDowngrade", new Date());
        const response = await axios.get(process.env.CRON_API_FIFTH_URL);
    },
    start: true,
    timeZone: 'America/Los_Angeles'
});

const jobSixth = CronJob.from({
    cronTime: '15 0 * * *',  // This runs at 12:15 AM every day
    onTick: async function () {
        console.log("CRON JOB STARTING jobSixth for archive-old-checkouts", new Date());
        const response = await axios.get(process.env.CRON_API_SIXTH_URL);
    },
    start: true,
    timeZone: 'America/Los_Angeles'
});



const app = express();

app.get("/api/test", (req, res) => {
    res.send({ success: true });
});

app.listen(process.env.CRON_SERVER_PORT, () => console.log("Cron Job is Running"));
