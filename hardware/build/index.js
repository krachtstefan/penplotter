"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var johnny_five_1 = require("johnny-five");
var board = new johnny_five_1.Board();
board.on("ready", function () {
    var led = new johnny_five_1.Led(13);
    led.blink(500);
});
