let INTERVAL = 1;

const page = {
    question: $("#question"),
    clues: $("#clues"),
    progress_bar: $("#progress-bar"),
    timer: {
        bar: $("#timer-bar"),
        num: $("#timer-num")
    },
    answer: $("#answer-box")
};
const timer = {
    ans: {
        track: $("#timer-ans-track"),
        bar: $("#timer-ans-bar"),
        num: $("#timer-ans-num")
    },
    clue: {
        track: $("#timer-clue-track"),
        bar: $("#timer-clue-bar"),
        num: $("#timer-clue-num")
    }
};


class Stage {
    constructor(begin_time) {
        this.begin_time = begin_time;
        this.entry_time = this.begin_time;

        this.set_time();
        this.set_answer();
        this.set_question();

        this.clues = [];
        this.clue_count = 0;
    }
    set_time(time = 0) {
        this.time = time;
    }
    set_answer(data = null, exp = "") {
        this.answer = data;
        this.answer_exp = "";
        return this;
    }
    set_question(data = "place holder question") {
        this.question = data;
        return this;
    }
    add_clue(clue, time) {
        if(this.clues.length > 0){
            let [_, prev, __] = this.clues[this.clues.length - 1];
            this.clues.push([clue, time, prev]);
        }
        else {
            this.clues.push([clue, time, 0]);
        }

        return this;
    }
    get_end() {
        return this.begin_time + this.time;
    }

    match_answer(answer) {
        const process = name => name.toLowerCase().split().join();
        return process(this.answer) === process(answer);
    }

    start(){
        this.entry_time = Date.now(); 
    }
    update_clue() {
        if (this.clue_count < this.clues.length) {
            const [clue, time, _] = this.clues[this.clue_count];

            if (time < Date.now() - this.entry_time) {
                const node = document.createElement("div");
                node.classList.add("card", "clue");

                const content = document.createElement("div");
                content.classList.add("content");
                content.innerHTML = clue;

                const header = document.createElement("header");
                header.innerText = `Clue ${this.clue_count + 1}`;
                header.onclick = () => {
                    node.classList.toggle("view");
                };

                node.appendChild(header);
                node.appendChild(content);
                page.clues.appendChild(node);

                this.clue_count += 1;
            }
        }
    }
    display_answer() {
        const node = document.createElement("div");
        node.classList.add("card", "clue");
        node.innerHTML = `The answer is ${this.answer}`;

        if (this.answer_exp.length > 0) {
            node.innerHTML += `<br>(${this.answer_exp})`;
        }

        page.clues.appendChild(node);
        this.display_answer = () => { };
    }
    update() {
        const T = Date.now();
        
        if(this.clue_count < this.clues.length) {
            const [_, time, prev] = this.clues[this.clue_count];

            const t_c = format_time(time - (T - this.entry_time));

            const c = `${this.clue_count + 1} of ${this.clues.length}`
            timer.clue.num.innerHTML = `Clue ${c}, in ${t_c}`;
            
            timer.clue.track.style.display = "inline-block";
        
            let P = (T - this.entry_time - prev)/(time - prev);
            timer.clue.bar.style.width = `${100 * P}%`;
        }
        else {
            timer.clue.num.innerHTML = "";
            timer.clue.track.style.display = "none";
        }


        let P = (T - this.begin_time) / this.time;
        if (P <= 1) {
            const t_a = format_time(this.get_end() - T);
            timer.ans.num.innerHTML = `Answer in ${t_a}`;

            if(P < 0){
                timer.ans.track.style.display = "none";
                timer.ans.bar.style.width = "100%";        
            }
            else {
                timer.ans.track.style.display = "inline-block";
                timer.ans.bar.style.width = `${100 * clamp(P, 0, 1)}%`;        
            }
        }
        else if (P > 1) {
            timer.ans.track.display = "none";
            this.display_answer();
        }

        this.update_clue();
    }
}

class StageManager {
    constructor(begin_time) {
        this.begin_time = begin_time;
        this.stages = [];
        this.current_stage = 0;
    }

    add_stage() {
        let begin_time = this.begin_time;
        if(this.stages.length > 0) {
            begin_time = this.stages[this.stages.length - 1].get_end()
        }

        let stage = new Stage(begin_time);
        this.stages.push(stage);
        return stage;
    }
    get_end() {
        if(this.stages.length > 0){
            return this.stages[this.stages.length - 1].get_end();
        }
        return this.begin_time;
    }

    start_game(progress_bar) {
        page.progress_bar.innerHTML = "";

        for (let i = 0; i < this.stages.length; i++) {
            let node = document.createElement("div");

            node.classList.add("level");
            if (i === 0) {
                node.classList.add("current");
            }
            page.progress_bar.appendChild(node);
        }

        this.setup_stage();
    }
    setup_stage() {
        let stage = this.stages[this.current_stage];
        page.question.innerHTML = stage.question;
        stage.start();
    }

    next_stage() {
        if (this.current_stage < this.stages.length) {
            page.clues.innerHTML = "";

            let node = page.progress_bar.childNodes[this.current_stage];

            node.classList.remove("current");
            node.classList.add("done");
            this.current_stage += 1;
        }

        if (this.current_stage < this.stages.length) {
            let node = page.progress_bar.childNodes[this.current_stage];
            node.classList.add("current");
            this.setup_stage();
        }
        else {
            this.update = () => { };
            end();
        }
    }
    submit_answer(answer) {
        let stage = this.stages[this.current_stage];
        if (Date.now() > stage.get_end() || stage.match_answer(answer)) {
            this.next_stage();
            return true;
        }
        return false;
    }

    update() {
        this.stages[this.current_stage].update();
    }
}

const convert_time = (min, sec) => (min * 60 + sec) * 1000;
const clamp = (x, low, high) => {
    if (x > high) {
        return high;
    } else if (x < low) {
        return low;
    }
    return x;
}
const format_time = milli => {
    let S = milli / 1000;
    let s = `${clamp(Math.floor(S % 60), 0, 60)}`.padStart(2, "0");
    let m = `${clamp(Math.floor((S / 60) % 60), 0, 60)}`.padStart(2, "0");

    return `${m}:${s}`;
}


let sman;
const setup = time => {
    let C = convert_time(0, 10);
    let I = convert_time(0, 20);

    //Im not getting paid so i dont have time to encrypt it properly, 
    //this will do to deter the average person

    let answers = [
        "\u0041\u004e\u0049\u004d\u0055\u0053",
        "\u0054\u0048\u0045 \u004f\u0056\u0045\u0052\u0043\u004f\u0041\u0054",
        "\u004c\u004f\u0047\u0041\u004e",
        "\u0046\u004f\u0052\u0052\u0045\u0053\u0054 \u0047\u0055\u004d\u0050",
        "\u004d\u0041\u0044\u004f\u004e\u004e\u0041",
        "\u0043\u0049\u0052\u0043\u0055\u0049\u0054 \u0044\u0045 \u004d\u004f\u004e\u0041\u0043\u004f",
        "\u0054\u0055\u0052\u0042\u004f",
        "\u0042\u0041\u004e\u0044\u0045\u0052\u0053\u004e\u0041\u0054\u0043\u0048",
        "\u0043\u004f\u004c\u004f\u0052\u0041\u0044\u004f",
    ]

    sman = new StageManager(time);

    sman.add_stage()
        .set_question(
            `A movie where genetics and a machine are the 
            key to unlocking the memories of past ancestors
            in order to locate ancient artifacts. What was 
            the name of the machine that was used in the 
            aforementioned process?`
        )
        .add_clue(
            `The movie’s main protagonist was also in the 
            same set of movies as James McAvoy`
            , C)
        .set_answer(answers.shift(), "Assassin’s Creed")
        .set_time(I);

    sman.add_stage()
        .set_question(
            `There is a book about an unfortunately named
            boy, this boy is named after a particularly 
            famous author. What is the story by this author
            that is given special emphasis in the book?`
        )
        .add_clue(
            `The film adaptation of the novel stars Kevin
            from How I Met Your Mother`
            , C)
        .set_answer(answers.shift(), "The Namesake – First Book")
        .set_time(I);

    sman.add_stage()
        .set_question(
            `I was weakened by the very thing that gave 
            me my power. I (the character) have also 
            appeared in 9 other movies. Which movie am I in?`
        )
        .add_clue(`My mentor was killed by my clone in this movie`, C)
        .add_clue(`This actor has played this role for 17 years`, 2 * C)
        .set_answer(answers.shift())
        .set_time(I);

    sman.add_stage()
        .set_question(
            `I am a cross country runner, a war veteran, 
            and a millionaire. Oh, also my wife is dead. 
            Which movie am I in?`
        )
        .add_clue(
            `The King of Pop has me to thank for his 
            signature dance move involving his legs`
            , C)
        .set_answer(answers.shift())
        .set_time(I);

    sman.add_stage()
        .set_question(
            `Name the artist who sang the melody, the
            meaning of which is in discussion in the
            opening shot of Quentin Tarantino’s first
            feature as a director`
        )
        .add_clue(
            `One of the protagonists in this movie is 
            the brother of the Pulp Fiction character 
            Vincent Vega`
            , C)
        .set_answer(answers.shift(), "Movie – Reservoir Dogs")
        .set_time(I);

    sman.add_stage()
        .set_question(
            `In the movie "Rush", there was a scene where 
            James was practicing a circuit in his garage 
            during which his future ex walks in on him 
            ultimately interrupting him. What track was 
            he practicing on?`
        )
        .add_clue(
            `<iframe width="100%" height="273" 
                src="https://www.youtube.com/embed/IyxOGLM-B8c" 
                frameborder="0" 
                allow="accelerometer; 
                autoplay; 
                clipboard-write; 
                encrypted-media; 
                gyroscope; 
                picture-in-picture" 
                allowfullscreen>
            </iframe>`
            , C)
        .add_clue(
            `Use the name of the corners to correlate it to a track`
        , 2 * C)
        .set_answer(answers.shift())
        .set_time(I);

    sman.add_stage()
        .set_question(
            `Slow, my kind are. But extremely fast 
            I became in an accident. Which movie am I in?`
        )
        .add_clue(
            `Took part in a competition I did, 
            in a state close to Illinois.`
        , C)
        .set_answer(answers.shift())
        .set_time(I);

    sman.add_stage()
        .set_question(
            `A movie (part of an anthology) riddled with
            decisions at every turn, reflecting a dark 
            society. What is the last part of the title 
            of the movie?`
        )
        .add_clue(
            `This movie’s director is also famous for his 
            work on one of the Twilight Saga films.`
        , C)
        .add_clue(`The movie has a similar format to Minecraft Story Mode`, 2 * C)
        .set_answer(answers.shift())
        .set_time(I);

    sman.add_stage()
        .set_question(
            `The last name of the artist of the song, 
            being sung in this scene, is the capital of which state?
            <br>
            <img width="100%" src="gcircle.png" alt="god help you i cant describe this image">
            `
        )
        .add_clue(
            `This movie stars Taron Egerton and Colin Firth`
        , 2 * C)
        .set_answer(answers.shift(),
            `Kingsman: The Golden Circle 
            <br>Country Roads 
            <br>John Denver`
        )
        .set_time(I);

    sman.start_game();
}

const submit = () => {
    if(sman.submit_answer(page.answer.value)){
        page.answer.value = "";
    }
}
let update = () => {
    sman.update();
    window.requestAnimationFrame(update);
}

const pass_decode = code => {
    const parity = x => {
        let [P, p] = [10, 0];

        while (x > P) {
            p = (p + x) % P;
            x = Math.floor(x / P);
        }
        return p;
    };

    const [CHAR_BEGIN, CHAR_WIDTH] = [42, 69];
    const from_chr = c => c.charCodeAt(0) - CHAR_BEGIN;

    let n = 0;
    for (let i = code.length - 1; i > 0; i--) {
        n = CHAR_WIDTH * n + from_chr(code[i]);
    }

    if (parity(n) == from_chr(code[0])) {
        return n;
    }
    return -1;
}
const start = () => {
    let code = $("input", $("#startmenu"))[0].value;

    if (code.length > 0) {
        let t = pass_decode(code);
        console.log(code, t);

        if (t !== -1) {
            let T = t * 1000; 
            
            $("#startmenu").style.display = "none";
            $("#waitmenu").style.display = "block";
            const wait = () => {
                let t = T - Date.now();

                if(t > 0){
                    $("#waitmenu").innerHTML = `Hunt begins in ${format_time(t)}`
                    console.log("Wait!");
                    window.requestAnimationFrame(wait);
                }
                else {
                    $("#waitmenu").style.display = "none";
                    $("#content").style.display = "block";
        
                    setup(T);
                    update();        
                }
            };
            wait();

        }
        else {
            $("#startmenu-error").innerText = "Error: Enter valid code";
        }
    }
}
const end = () => {
    $("#content").style.display = "none";
    $("#endmenu").style.display = "block";
    update = () => { };
}
const send_name = () => {
    let name = $("input", $("#endmenu"))[0].value;
    console.log(`WINNER = ${name}`);
}