let canvas=document.getElementById("simCanvas");
let ctx=canvas.getContext("2d");
let startBtn=document.getElementById("startBtn");
let stopBtn=document.getElementById("stopBtn");
let resetBtn=document.getElementById("resetBtn");
let generationSpan=document.getElementById("generation");
let rabbitsSpan=document.getElementById("rabbits");
let wolvesSpan=document.getElementById("wolves");
let avgRabbitSpeedSpan=document.getElementById("avgRabbitSpeed");
let avgRabbitSizeSpan=document.getElementById("avgRabbitSize");
let avgWolfSpeedSpan=document.getElementById("avgWolfSpeed");
let avgWolfSizeSpan=document.getElementById("avgWolfSize");
let rabbitSpeedWeightInput=document.getElementById("rabbitSpeedWeight");
let rabbitSizeWeightInput=document.getElementById("rabbitSizeWeight");
let wolfSpeedWeightInput=document.getElementById("wolfSpeedWeight");
let wolfSizeWeightInput=document.getElementById("wolfSizeWeight");
let rabbitSpeedWeightValue=document.getElementById("rabbitSpeedWeightValue");
let rabbitSizeWeightValue=document.getElementById("rabbitSizeWeightValue");
let wolfSpeedWeightValue=document.getElementById("wolfSpeedWeightValue");
let wolfSizeWeightValue=document.getElementById("wolfSizeWeightValue");
rabbitSpeedWeightInput.addEventListener("input", ()=>rabbitSpeedWeightValue.textContent=rabbitSpeedWeightInput.value);
rabbitSizeWeightInput.addEventListener("input", ()=>rabbitSizeWeightValue.textContent=rabbitSizeWeightInput.value);
wolfSpeedWeightInput.addEventListener("input", ()=>wolfSpeedWeightValue.textContent=wolfSpeedWeightInput.value);
wolfSizeWeightInput.addEventListener("input", ()=>wolfSizeWeightValue.textContent=wolfSizeWeightInput.value);
let rabbits=[];
let wolves=[];
let generation=0;
let animationId=null;
let POPULATION_RABBITS=100;
let POPULATION_WOLVES=20;
let MAX_SPEED=10;
let MAX_SIZE=10;
let MUTATION_RATE=.1;
let GENERATION_DURATION=5000;
class Creature{
    constructor(x, y, type, traits){
        this.x=x;
        this.y=y;
        this.type=type;
        this.traits=traits;
        this.radius=5+this.traits.size*.5;
    }
    move(){
        let angle=Math.random()*2*Math.PI;
        this.x+=Math.cos(angle)*this.traits.speed;
        this.y+=Math.sin(angle)*this.traits.speed;
        this.x=Math.max(this.radius, Math.min(canvas.width-this.radius, this.x));
        this.y=Math.max(this.radius, Math.min(canvas.height-this.radius, this.y));
    }
    draw(){
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
        ctx.fillStyle=this.type=="rabbit"?"green":"red";
        ctx.fill();
        ctx.closePath();
    }
}
function initializePopulations(){
    rabbits=[];
    for (let i=0;i<POPULATION_RABBITS;i++){
        let x=Math.random()*canvas.width;
        let y=Math.random()*canvas.height;
        let speed=Math.random()*MAX_SPEED;
        let size=Math.random()*MAX_SIZE;
        rabbits.push(new Creature(x, y, "rabbit",{speed: speed, size: size}));
    }
    wolves=[];
    for (let i=0;i<POPULATION_WOLVES;i++){
        let x=Math.random()*canvas.width;
        let y=Math.random()*canvas.height;
        let speed=Math.random()*MAX_SPEED;
        let size=Math.random()*MAX_SIZE;
        wolves.push(new Creature(x, y, "wolf",{speed: speed, size: size}));
    }
    updateStats();
}
function getAverageTrait(creatures, trait){
    let total=creatures.reduce((sum, c)=>sum+c.traits[trait], 0);
    return total/creatures.length||0;
}
function selectRabbitSurvivors(){
    let avgWolfSpeed=getAverageTrait(wolves, "speed");
    let avgWolfSize=getAverageTrait(wolves, "size");
    let speedWeight=parseFloat(rabbitSpeedWeightInput.value);
    let sizeWeight=parseFloat(rabbitSizeWeightInput.value);
    rabbits=rabbits.filter(rabbit=>{
        let speedScore=rabbit.traits.speed/(rabbit.traits.speed+avgWolfSpeed);
        let sizeScore=rabbit.traits.size/(rabbit.traits.size+avgWolfSize);
        let survivalProb=(speedWeight*speedScore+sizeWeight*sizeScore)/(speedWeight+sizeWeight||1);
        return Math.random()<survivalProb;
    });
    if (rabbits.length<POPULATION_RABBITS*.1){
        let survivors=[];
        for (let i=0;i<POPULATION_RABBITS*.1;i++){
            let speed=Math.random()*MAX_SPEED;
            let size=Math.random()*MAX_SIZE;
            survivors.push(new Creature(canvas.width/2, canvas.height/2, "rabbit",{speed: speed, size: size}));
        }
        rabbits=survivors;
    }
}
function selectParent(creatures, traitWeights){
    let speedWeight=parseFloat(traitWeights.speed);
    let sizeWeight=parseFloat(traitWeights.size);
    let totalFitness=creatures.reduce((sum, c)=>{
        return sum+(speedWeight*c.traits.speed+sizeWeight*c.traits.size);
    }, 0);
    let rand=Math.random()*totalFitness;
    for (let creature of creatures){
        rand-=(speedWeight*creature.traits.speed+sizeWeight*creature.traits.size);
        if (rand<=0) return creature;
    }
    return creatures[creatures.length-1];
}
function reproduceRabbits(){
    let newRabbits=[];
    while (newRabbits.length<POPULATION_RABBITS){
        let parent=rabbits[Math.floor(Math.random()*rabbits.length)];
        let speed=Math.max(0, Math.min(MAX_SPEED, parent.traits.speed+(Math.random()*2-1)*MUTATION_RATE));
        let size=Math.max(0, Math.min(MAX_SIZE, parent.traits.size+(Math.random()*2-1)*MUTATION_RATE));
        let x=Math.random()*canvas.width;
        let y=Math.random()*canvas.height;
        newRabbits.push(new Creature(x, y, "rabbit",{speed: speed, size: size}));
    }
    rabbits=newRabbits;
}
function reproduceWolves(){
    let newWolves=[];
    let traitWeights={speed: wolfSpeedWeightInput.value, size: wolfSizeWeightInput.value};
    while (newWolves.length<POPULATION_WOLVES){
        let parent=selectParent(wolves, traitWeights);
        let speed=Math.max(0, Math.min(MAX_SPEED, parent.traits.speed+(Math.random()*2-1)*MUTATION_RATE));
        let size=Math.max(0, Math.min(MAX_SIZE, parent.traits.size+(Math.random()*2-1)*MUTATION_RATE));
        let x=Math.random()*canvas.width;
        let y=Math.random()*canvas.height;
        newWolves.push(new Creature(x, y, "wolf",{speed: speed, size: size}));
    }
    wolves=newWolves;
}
function animate(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    rabbits.forEach(rabbit=>{
        rabbit.move();
        rabbit.draw();
    });
    wolves.forEach(wolf=>{
        wolf.move();
        wolf.draw();
    });
    updateStats();
    animationId=requestAnimationFrame(animate);
}
function startSimulation(){
    if (!animationId){
        animate();
        startBtn.disabled=true;
        stopBtn.disabled=false;
        setTimeout(()=>{
            selectRabbitSurvivors();
            reproduceRabbits();
            reproduceWolves();
            generation++;
            updateStats();
            if (animationId){
                setTimeout(()=>startSimulation(), GENERATION_DURATION);
            }
        }, GENERATION_DURATION);
    }
}
function stopSimulation(){
    if (animationId){
        cancelAnimationFrame(animationId);
        animationId=null;
        startBtn.disabled=false;
        stopBtn.disabled=true;
    }
}
function resetSimulation(){
    stopSimulation();
    generation=0;
    initializePopulations();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    rabbits.forEach(rabbit=>rabbit.draw());
    wolves.forEach(wolf=>wolf.draw());
    updateStats();
}
function updateStats(){
    generationSpan.textContent=generation;
    rabbitsSpan.textContent=rabbits.length;
    wolvesSpan.textContent=wolves.length;
    let avgRabbitSpeed=getAverageTrait(rabbits, "speed").toFixed(2);
    let avgRabbitSize=getAverageTrait(rabbits, "size").toFixed(2);
    let avgWolfSpeed=getAverageTrait(wolves, "speed").toFixed(2);
    let avgWolfSize=getAverageTrait(wolves, "size").toFixed(2);
    avgRabbitSpeedSpan.textContent=avgRabbitSpeed;
    avgRabbitSizeSpan.textContent=avgRabbitSize;
    avgWolfSpeedSpan.textContent=avgWolfSpeed;
    avgWolfSizeSpan.textContent=avgWolfSize;
}
startBtn.addEventListener("click", startSimulation);
stopBtn.addEventListener("click", stopSimulation);
resetBtn.addEventListener("click", resetSimulation);
initializePopulations();
rabbits.forEach(rabbit=>rabbit.draw());
wolves.forEach(wolf=>wolf.draw());
updateStats();