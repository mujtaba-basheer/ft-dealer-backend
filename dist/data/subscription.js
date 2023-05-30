"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const limits = [
    // Starter
    {
        sid: "62a83d561c4a210004ad804d",
        limit: {
            self: {
                like: 2,
                reply: 2,
                retweet: 2,
            },
            others: {
                like: 7,
                reply: 5,
                retweet: 7,
            },
        },
        usernames: 1,
    },
    // Intermediate
    {
        sid: "62c2d0522d52a700044eba24",
        limit: {
            self: {
                like: 4,
                reply: 4,
                retweet: 4,
            },
            others: {
                like: 7,
                reply: 5,
                retweet: 7,
            },
        },
        usernames: 1,
    },
    // Pro
    {
        sid: "62c2d064f577150004d2bc66",
        limit: {
            self: {
                like: 6,
                reply: 6,
                retweet: 6,
            },
            others: {
                like: 7,
                reply: 5,
                retweet: 7,
            },
        },
        usernames: 1,
    },
    // Business
    {
        sid: "62c2d08dd283020004adbe66",
        limit: {
            self: {
                like: 12,
                reply: 12,
                retweet: 12,
            },
            others: {
                like: 7,
                reply: 5,
                retweet: 7,
            },
        },
        usernames: 3,
    },
];
exports.default = limits;
