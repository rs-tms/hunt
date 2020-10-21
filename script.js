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

class Stage {
    constructor(begin_time) {
        this.begin_time = begin_time;
        this.interval = 0;

        this.set_answer();
        this.set_question();

        this.clues = [];
        this.clue_count = 0;
    }
    set_answer(data = "answer", exp = "") {
        this.answer = data;
        this.answer_exp = "";
        return this;
    }
    set_question(data = "place holder question") {
        this.question = data;
        return this;
    }
    add_clue(clue, time) {
        this.interval += time;
        this.clues.push([clue, this.begin_time + this.interval]);
        return this;
    }
    push_end(time) {
        this.interval += time;
    }
    get_end(){
        return this.begin_time + this.interval;
    }

    match_answer(answer) {
        const process = name => name.toLowerCase().split().join();
        return process(this.answer) === process(answer);    
    }

    update_clue() {
        if (this.clue_count < this.clues.length) {
            const [clue, time] = this.clues[this.clue_count];

            if (time < Date.now()) {
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
        
        if(this.answer_exp.length > 0) {
            node.innerHTML += `<br>(${this.answer_exp})`;
        }
        
        page.clues.appendChild(node);
        this.display_answer = () => { };
    }
    update() {
        let P = (Date.now() - this.begin_time) / this.interval;
        if (0 <= P && P <= 1) {
            page.timer.bar.style.width = `${100 * P}%`;

            if (this.clue_count < this.clues.length) {
                const [_, time] = this.clues[this.clue_count];
                const t = format_time(time - Date.now());
                const c = `${this.clue_count + 1} of ${this.clues.length}`
                page.timer.num.innerHTML = `Clue ${c}, in ${t}`;
            }
            else {
                const t = format_time(this.begin_time + this.interval - Date.now());
                page.timer.num.innerHTML = `${t} remaining`
            }
        }
        else if (P < 0) {
            const t = format_time(this.begin_time - Date.now());
            page.timer.num.innerHTML = `Stage starting in ${t}`
            page.timer.bar.style.width = `100%`;
        }
        else if (P > 1) {
            this.display_answer();
        }

        this.update_clue();
    }
    displace_time(time) {
        //this.begin_time += time;
        for(let i = 0; i < this.clues.length; i++){
            this.clues[i][1] += time;
        }
    }
}

class StageManager {
    constructor(begin_time) {
        this.begin_time = begin_time;
        this.stages = [];
        this.current_stage = 0;
        this.set_synchronized();
    }

    set_synchronized(sync = true){
        this.synchronized = sync;
    }
    add_stage() {
        let begin_time = this.begin_time;

        let prev = this.stages[this.stages.length - 1];
        if (prev !== undefined) {
            begin_time += prev.interval;
        }

        stage = new Stage(begin_time);
        this.stages.push(stage)
        return stage;
    }

    start_game(progress_bar) {
        page.progress_bar.innerHTML = "";

        for (let i = 0; i < this.stages.length; i++) {
            let node = document.createElement("div");

            node.classList.add("level");
            if (i === 0) {
                node.classList.add("current");
            }

            node.innerHTML = i + 1;

            page.progress_bar.appendChild(node);
        }

        this.setup_stage();
    }
    setup_stage() {
        let stage = this.stages[this.current_stage];
        page.question.innerHTML = stage.question;
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
    displace_time(time) {
        this.begin_time += time;
        for(let child of this.stages){
            child.displace_time(time);
        }
    }
    submit_answer(answer){
        let stage = this.stages[this.current_stage];
        let t = Date.now();

        const update = () => {
            if(!this.synchronized && this.current_stage < this.stages.length) {
                stage = this.stages[this.current_stage];
                let delta = stage.begin_time - t;
                this.displace_time(-delta);    
                this.update();
            }
        }

        if(stage.begin_time < t) {
            if(t > stage.get_end()) {
                this.next_stage();
                update();
            }
            else if(stage.match_answer(answer)) {                
                this.next_stage();
                update();
            }    
        }
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
    let C = convert_time(0, 30)
    let E = convert_time(0, 30);

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
        .set_question("Begin Quiz")
        .set_answer("")
        .push_end(0);

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
        .push_end(E);
    
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
        .push_end(E);
    
    sman.add_stage()
        .set_question(
            `I was weakened by the very thing that gave 
            me my power. I (the character) have also 
            appeared in 9 other movies. Which movie am I in?`
        )
        .add_clue(`My mentor was killed by my clone in this movie`, C)
        .add_clue(`This actor has played this role for 17 years`, C)
        .set_answer(answers.shift())
        .push_end(E);    
    
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
        .push_end(E);    

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
        .push_end(E);

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
        .add_clue(`Use the name of the corners to correlate it to a track`, C)
        .set_answer(answers.shift())
        .push_end(E);


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
        .push_end(E);

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
        .add_clue(`The movie has a similar format to Minecraft Story Mode`, C)
        .set_answer(answers.shift())
        .push_end(E);


    sman.add_stage()
        .set_question(
            `The last name of the artist of the song, 
            being sung in this scene, is the capital of which state?
            <br>
            <img width="100%" src="gcircle.png" alt="god help you i cant describe this image">
            `
        )
        .add_clue(`This movie stars Taron Egerton and Colin Firth`, C)
        .set_answer(answers.shift(), 
            `Kingsman: The Golden Circle 
            <br>Country Roads 
            <br>John Denver`
        )
        .push_end(E);

    sman.set_synchronized(false);
    sman.start_game();
}

const submit = () => {
    sman.submit_answer(page.answer.value);
}
let update = () => {
    sman.update();
    window.requestAnimationFrame(update);
}

const pass_decode = code => {       
    const parity = x => {
        let [P, p] = [10, 0];
    
        while(x > P){
            p = (p + x) % P;
            x = Math.floor(x/P);
        }
        return p;
    };

    const [CHAR_BEGIN, CHAR_WIDTH] = [42, 69];
    const from_chr = c => c.charCodeAt(0) - CHAR_BEGIN;

    let n = 0;
    for(let i = code.length - 1; i > 0; i--) {
        n = CHAR_WIDTH * n + from_chr(code[i]);
    }

    if (parity(n) == from_chr(code[0])){
        return n;
    }
    return -1;
}
const start = () => {
    let code = $("input", $("#startmenu"))[0].value;

    if(code.length > 0){
        let t = pass_decode(code);
        console.log(code, t);

        if(t !== -1){
            let T = t * 1000; 
            console.log(`TIME ${T}`)

            $("#startmenu").style.display = "none";
            $("#content").style.display = "block";

            setup(T);
            update();    
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