let update, render;


let start = (fps) => {
    console.log(`start ${fps}`)
    fixedDeltaTime = 1000 / fps;
    prevTimestamp = window.performance.now();
    startTime = prevTimestamp;
    render();
}

let GameLoop = class GameLoop {
    constructor(caller) {
        console.log("Gameloop Constructor")
        this.caller = caller;
        console.log(caller)

        this.start = start
    }
}


export { GameLoop }