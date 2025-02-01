// Module aliases for Matter.js
const Engine = Matter.Engine,
      World  = Matter.World,
      Bodies = Matter.Bodies,
      Body   = Matter.Body,
      Constraint = Matter.Constraint,
      Composite = Matter.Composite;

// Global variables
let engine, world;
let ground, leftWall, rightWall;
let stickman = {}; // object to hold stickman parts and constraints
let ai;
let standTimer = 0;
let standing = false;

function setup() {
  createCanvas(800, 600);
  
  // Create engine and world
  engine = Engine.create();
  world = engine.world;
  world.gravity.y = 1; // gravity
  
  // Create boundaries: ground, left and right walls
  ground = Bodies.rectangle(width/2, height - 10, width, 20, { isStatic: true });
  leftWall = Bodies.rectangle(0, height/2, 20, height, { isStatic: true });
  rightWall = Bodies.rectangle(width, height/2, 20, height, { isStatic: true });
  World.add(world, [ground, leftWall, rightWall]);
  
  // Create stickman parts:
  // We'll build a simple stickman with head, torso, arms and legs.
  // Adjust positions so the stickman starts near the center.
  let startX = width/2, startY = height/2 - 100;
  
  // Head: circle
  stickman.head = Bodies.circle(startX, startY, 15, { density: 0.001, friction: 0.1 });
  
  // Torso: rectangle
  stickman.torso = Bodies.rectangle(startX, startY + 40, 20, 60, { density: 0.001, friction: 0.1 });
  
  // Upper arms: rectangles
  stickman.upperArmL = Bodies.rectangle(startX - 25, startY + 30, 30, 8, { density: 0.001, friction: 0.1 });
  stickman.upperArmR = Bodies.rectangle(startX + 25, startY + 30, 30, 8, { density: 0.001, friction: 0.1 });
  
  // Lower arms: rectangles
  stickman.lowerArmL = Bodies.rectangle(startX - 45, startY + 30, 30, 8, { density: 0.001, friction: 0.1 });
  stickman.lowerArmR = Bodies.rectangle(startX + 45, startY + 30, 30, 8, { density: 0.001, friction: 0.1 });
  
  // Upper legs: rectangles
  stickman.upperLegL = Bodies.rectangle(startX - 7, startY + 80, 10, 40, { density: 0.001, friction: 0.1 });
  stickman.upperLegR = Bodies.rectangle(startX + 7, startY + 80, 10, 40, { density: 0.001, friction: 0.1 });
  
  // Lower legs: rectangles (feet)
  stickman.lowerLegL = Bodies.rectangle(startX - 7, startY + 130, 10, 40, { density: 0.001, friction: 0.8 });
  stickman.lowerLegR = Bodies.rectangle(startX + 7, startY + 130, 10, 40, { density: 0.001, friction: 0.8 });
  
  // Add all parts to the world
  let parts = [
    stickman.head, stickman.torso,
    stickman.upperArmL, stickman.upperArmR,
    stickman.lowerArmL, stickman.lowerArmR,
    stickman.upperLegL, stickman.upperLegR,
    stickman.lowerLegL, stickman.lowerLegR
  ];
  World.add(world, parts);
  
  // Create constraints (joints) between parts with fixed lengths
  stickman.constraints = [];
  
  // Head to torso
  stickman.constraints.push(Constraint.create({
    bodyA: stickman.head,
    pointA: { x: 0, y: 15 },
    bodyB: stickman.torso,
    pointB: { x: 0, y: -30 },
    length: 0,
    stiffness: 1
  }));
  
  // Torso to upper arms
  stickman.constraints.push(Constraint.create({
    bodyA: stickman.torso,
    pointA: { x: -10, y: -20 },
    bodyB: stickman.upperArmL,
    pointB: { x: 15, y: 0 },
    length: 0,
    stiffness: 0.7
  }));
  stickman.constraints.push(Constraint.create({
    bodyA: stickman.torso,
    pointA: { x: 10, y: -20 },
    bodyB: stickman.upperArmR,
    pointB: { x: -15, y: 0 },
    length: 0,
    stiffness: 0.7
  }));
  
  // Upper arms to lower arms (elbow joints)
  stickman.constraints.push(Constraint.create({
    bodyA: stickman.upperArmL,
    pointA: { x: -15, y: 0 },
    bodyB: stickman.lowerArmL,
    pointB: { x: 15, y: 0 },
    length: 0,
    stiffness: 0.7
  }));
  stickman.constraints.push(Constraint.create({
    bodyA: stickman.upperArmR,
    pointA: { x: 15, y: 0 },
    bodyB: stickman.lowerArmR,
    pointB: { x: -15, y: 0 },
    length: 0,
    stiffness: 0.7
  }));
  
  // Torso to upper legs (hip joints)
  stickman.constraints.push(Constraint.create({
    bodyA: stickman.torso,
    pointA: { x: -5, y: 30 },
    bodyB: stickman.upperLegL,
    pointB: { x: 0, y: -20 },
    length: 0,
    stiffness: 0.8
  }));
  stickman.constraints.push(Constraint.create({
    bodyA: stickman.torso,
    pointA: { x: 5, y: 30 },
    bodyB: stickman.upperLegR,
    pointB: { x: 0, y: -20 },
    length: 0,
    stiffness: 0.8
  }));
  
  // Upper legs to lower legs (knee joints)
  stickman.constraints.push(Constraint.create({
    bodyA: stickman.upperLegL,
    pointA: { x: 0, y: 20 },
    bodyB: stickman.lowerLegL,
    pointB: { x: 0, y: -20 },
    length: 0,
    stiffness: 0.8
  }));
  stickman.constraints.push(Constraint.create({
    bodyA: stickman.upperLegR,
    pointA: { x: 0, y: 20 },
    bodyB: stickman.lowerLegR,
    pointB: { x: 0, y: -20 },
    length: 0,
    stiffness: 0.8
  }));
  
  // Add all constraints to the world
  World.add(world, stickman.constraints);
  
  // Initialize the AI controller for the stickman
  ai = new StickmanAI();
}

function draw() {
  background(220);
  Engine.update(engine);
  
  // Draw ground and boundaries
  noStroke();
  fill(100);
  drawBody(ground);
  drawBody(leftWall);
  drawBody(rightWall);
  
  // Draw stickman parts
  fill(0);
  drawBody(stickman.head);
  drawBody(stickman.torso);
  drawBody(stickman.upperArmL);
  drawBody(stickman.upperArmR);
  drawBody(stickman.lowerArmL);
  drawBody(stickman.lowerArmR);
  drawBody(stickman.upperLegL);
  drawBody(stickman.upperLegR);
  drawBody(stickman.lowerLegL);
  drawBody(stickman.lowerLegR);
  
  // Let the AI control the stickman (placeholder control)
  ai.control();
  
  // Check if only the feet are touching the ground
  if (feetTouchingFloor()) {
    standTimer += deltaTime;
    if (standTimer >= 3000) { // 3000 ms = 3 seconds
      fill(0, 150, 0);
      textSize(32);
      text("Goal Achieved!", width/2 - 100, 50);
    }
  } else {
    standTimer = 0;
  }
  
  // Display timer info
  fill(0);
  textSize(16);
  text("Standing time: " + (standTimer/1000).toFixed(2) + " sec", 10, 20);
}

// Helper to draw a Matter body
function drawBody(body) {
  push();
  translate(body.position.x, body.position.y);
  rotate(body.angle);
  if (body.circleRadius) {
    ellipse(0, 0, body.circleRadius*2);
  } else {
    let w = body.bounds.max.x - body.bounds.min.x;
    let h = body.bounds.max.y - body.bounds.min.y;
    rectMode(CENTER);
    rect(0, 0, w, h);
  }
  pop();
}

// Check if only the feet (lowerLegs) are touching the floor (ground)
function feetTouchingFloor() {
  // Simple check: if both lower legs are near the ground (y coordinate near ground)
  let tolerance = 5;
  let leftFoot = stickman.lowerLegL.position;
  let rightFoot = stickman.lowerLegR.position;
  return (leftFoot.y + tolerance >= ground.position.y - 10 &&
          rightFoot.y + tolerance >= ground.position.y - 10);
}

// Placeholder AI class
class StickmanAI {
  constructor() {
    // In a self-learning scenario, you would initialize your RL network here.
    // For now, we use random small torques as a stand-in.
    this.torqueStrength = 0.00005;
  }
  
  control() {
    // For each joint (here we apply torques to the bodies at the joints)
    // We will “control” the limbs by applying a small random torque.
    // In a real RL system, you would compute these based on observations and a policy.
    let bodies = [
      stickman.torso,
      stickman.upperArmL, stickman.lowerArmL,
      stickman.upperArmR, stickman.lowerArmR,
      stickman.upperLegL, stickman.lowerLegL,
      stickman.upperLegR, stickman.lowerLegR
    ];
    bodies.forEach(body => {
      let randomTorque = random(-this.torqueStrength, this.torqueStrength);
      Body.applyForce(body, body.position, { x: 0, y: randomTorque });
    });
    
    // Prevent the stickman from leaving the screen: if any part gets too close to a wall, push it back.
    bodies.forEach(body => {
      if (body.position.x < 30) {
        Body.applyForce(body, body.position, { x: 0.005, y: 0 });
      }
      if (body.position.x > width - 30) {
        Body.applyForce(body, body.position, { x: -0.005, y: 0 });
      }
    });
  }
}
