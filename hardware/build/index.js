"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const johnny_five_1 = require("johnny-five");
const board = new johnny_five_1.Board();
board.on("ready", () => {
    const led = new johnny_five_1.Led(13);
    led.blink(500);
});
