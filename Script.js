// Import Matter.js
let Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Constraint = Matter.Constraint;

let engine, world;
let stickman, joints = [];
let ai;

// Stickman parts
let head, torso, upperArms, lowerArms, upperLegs, lowerLegs;
let constraints = [];

function setup() {
    createCanvas(600, 400);
    engine = Engine.create();
    world = engine.world;

    // Stickman body parts
    head = Bodies.circle(300, 100, 15, { restitution: 0.5 });
    torso = Bodies.rectangle(300, 160, 20, 60, { restitution: 0.5 });

    upperArms = [
        Bodies.rectangle(270, 160, 30, 10),
        Bodies.rectangle(330, 160, 30, 10)
    ];
    lowerArms = [
        Bodies.rectangle(250, 180, 30, 10),
        Bodies.rectangle(350, 180, 30, 10)
    ];

    upperLegs = [
        Bodies.rectangle(290, 210, 10, 40),
        Bodies.rectangle(310, 210, 10, 40)
    ];
    lowerLegs = [
        Bodies.rectangle(290, 260, 10, 40),
        Bodies.rectangle(310, 260, 10, 40)
    ];

    // Joints (constraints)
    constraints.push(Constraint.create({ bodyA: head, bodyB: torso }));
    constraints.push(Constraint.create({ bodyA: torso, bodyB: upperArms[0] }));
    constraints.push(Constraint.create({ bodyA: torso, bodyB: upperArms[1] }));
    constraints.push(Constraint.create({ bodyA: upperArms[0], bodyB: lowerArms[0] }));
    constraints.push(Constraint.create({ bodyA: upperArms[1], bodyB: lowerArms[1] }));
    constraints.push(Constraint.create({ bodyA: torso, bodyB: upperLegs[0] }));
    constraints.push(Constraint.create({ bodyA: torso, bodyB: upperLegs[1] }));
    constraints.push(Constraint.create({ bodyA: upperLegs[0], bodyB: lowerLegs[0] }));
    constraints.push(Constraint.create({ bodyA: upperLegs[1], bodyB: lowerLegs[1] }));

    // Add all bodies and constraints to the world
    let allBodies = [head, torso, ...upperArms, ...lowerArms, ...upperLegs, ...lowerLegs];
    allBodies.forEach(body => World.add(world, body));
    constraints.forEach(c => World.add(world, c));

    ai = new StickmanAI();
}

function draw() {
    background(220);
    Engine.update(engine);

    // Draw stickman
    drawBodyPart(head);
    drawBodyPart(torso);
    upperArms.forEach(drawBodyPart);
    lowerArms.forEach(drawBodyPart);
    upperLegs.forEach(drawBodyPart);
    lowerLegs.forEach(drawBodyPart);

    // AI updates joint angles
    ai.control(stickman);
}

// Draw function for bodies
function drawBodyPart(body) {
    let pos = body.position;
    let angle = body.angle;
    push();
    translate(pos.x, pos.y);
    rotate(angle);
    rectMode(CENTER);
    rect(0, 0, body.bounds.max.x - body.bounds.min.x, body.bounds.max.y - body.bounds.min.y);
    pop();
}

// Basic AI class (to be improved with reinforcement learning)
class StickmanAI {
    constructor() {
        this.timer = 0;
    }

    control() {
        // Simple random adjustments (later: learn from attempts)
        for (let i = 0; i < joints.length; i++) {
            Matter.Body.setAngle(joints[i], joints[i].angle + random(-0.1, 0.1));
        }

        // Check if standing
        if (this.isStanding()) {
            this.timer++;
            if (this.timer > 180) { // 3 seconds at 60fps
                console.log("Success!");
            }
        } else {
            this.timer = 0;
        }
    }

    isStanding() {
        let feet = [lowerLegs[0], lowerLegs[1]];
        let touchingFloor = feet.every(leg => leg.position.y > height - 10);
        return touchingFloor;
    }
}
