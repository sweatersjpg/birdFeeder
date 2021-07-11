// Grid collision attempt 1.0
// sweatersjpg

// let drawFN;

const DEBUG = false;

// let savedFrames = [];

function init_() {
  setSpriteSheet("spriteSheet");
  setNumberOfLayers(60);
  lset(1);
  pause_Button_.paused = false;
  drawFN = new Game();
}

// ------- main loops -------

function Game() {
  this.actors = [];
  this.seeds = [];
  new Seed(200, 120, this);
  // new Bird(200, 120, this);
  this.spb = 4;

  this.draw = () => {

    // if(btn('a')) saveCanvas(frameCount + ".png", 'png');

    cls(63);
    // put(this.actors.length, 0, 0, 48);

    if(mouseIsPressed || touches.length) {
      new Seed(mouseX/D.S, mouseY/D.S, this);
    }

    this.seeds = [];
    for (var a of this.actors)
    if(a.type == 'seed' && a.vel.mag() < 0.5 && !a.targeted) this.seeds.push(a);

    let nbirds = this.actors.length - this.seeds.length;
    let nseeds = this.seeds.length;
    let spb = nseeds/nbirds;
    let chance = 0.2 * (spb - this.spb) * (spb - this.spb);
    if(spb < this.spb) chance = 0;
    if(!nbirds) r = Infinity;
    else r = random(chance + 10);
    if(!this.seeds.length) r = 0;
    if(r > 10) new Bird(random(0, 400), -16, this);

    for (var a of this.actors) a.update();
    for (var a of this.actors) a.draw();
  }

  this.remove = (a) => {
    this.actors.splice(this.actors.indexOf(a), 1);
  }

  // this.mousedown = (e) => {
  //   let mouse = new Vector(mouseX/D.S, mouseY/D.S);
  //   for (var i = 0; i < Math.floor(random(4,8)); i++) {
  //     new Seed(mouse.x, mouse.y, this);
  //   }
  //   // new Bird(mouse.x, mouse.y,this);
  // }
}

function Bird(x, y, game) {
  this.type = 'bird';

  this.pos = new Vector(x, y);
  this.vel = new Vector(0,0,0);
  this.dir = false;

  this.ht = 0;
  this.peck = 0;
  this.fleeing = false;

  game.actors.push(this);

  this.update = () => {
    if(this.state != 'leaving') this.vel.h -= 0.5;

    let bffr = 20;
    if(this.pos.x > 400+bffr || this.pos.x < -bffr || this.pos.y > 240+bffr || this.pos.y < -bffr) {
      if(this.seed) this.seed.targeted = false;
      game.remove(this);
    }

    pm = new Vector(pmouseX, pmouseY);
    m = new Vector(mouseX, mouseY);
    if(m.dist(pm) > 5) {
      if(this.state != 'leaving' && this.pos.h < 1 /*&& !this.fleeing*/ && this.mouseNear()) {
        this.target('away');
      }
    }

    if(this.vel.h < 0) this.vel.h += 0.4;
    this.pos.add(this.vel);
    if(this.pos.h < 0) {
      this.pos.h = 0;
      this.vel.h = 0;
    }
    if(this.state == 'pecking') {
      let r = Math.random();
      if(!this.peck && r < 0.2) {
        this.peck = 4;
        this.seed.health -= 1;
      }
      if(this.seed.dead) {
        this.seed = false;
        this.state = 'wandering';
      }
    } else if(this.state == 'targeting') {
      if(this.pos.dist(this.dest) < 3 && this.pos.h <= 0) {
        if(this.fleeing) this.fleeing = false;
        this.vel = new Vector(0,0,this.vel.h);
        if(this.seed) this.state = "pecking";
        else this.state = 'wandering';
      }
    } else if(this.state == 'wandering') {
      let nbirds = 0;
      for (let a of game.actors) {
        if(a.type == "bird" && a.state != 'leaving') nbirds++;
      }
      let nseeds = game.seeds.length;
      let spb = nseeds/nbirds;
      let chance = 0.2 * (spb - game.spb) * (spb - game.spb);
      if(spb > game.spb) chance = 0;
      if(nbirds == 1) chance = 0;
      if(!nseeds) chance = 5;
      r = random(chance + 50);
      if(r > 50) {
        this.state = 'leaving';
        let x = random([-1,1]) * random(3,5);
        this.vel = new Vector(x,0,4);
      } else {
        r = floor(random(1000));
        if(r <= 20) {
          this.target('random');
        } else if(r <= 70) {
          this.target('seed');
        } else if(r <= 90 && !this.peck) {
          this.peck = 4;
        }
      }

    } else if(this.state == 'leaving') {
      if(this.pos.y - this.pos.h < 0) game.remove(this);
    }
  }

  this.draw = () => {
    let t = 0;
    if(this.state == 'targeting' || this.state == 'leaving') {
      if(this.pos.h > 0) {
        t = (frameCount/2) % 2 + 5;
        if(this.vel.h > 10) t = 0;
      } else {
        this.ht += this.vel.mag() * 4/18;
        this.ht %= 4;
        t = this.ht;
      }
    }
    if(this.vel.mag() < 0.5 && abs(this.vel.h) < 0.5) t = -2;
    if(this.peck){
      this.peck--;
      if(this.peck >= 2) t = -1;
    }

    if(this.state == 'targeting') this.dir = this.pos.x > this.dest.x;
    if(this.state == 'leaving') this.dir = this.vel.x <= 0;

    let layer = floor((this.pos.y)/4);
    lset(layer > 0 ? layer % 60 : 0);

    palset([48,63,64]);
    if(this.state == 'targeting' && DEBUG) palset([48,6,64]);

    spr(t + 3, this.pos.x - 8, this.pos.y - this.pos.h - 16, 1, 1, this.dir);

    if(this.state != 'leaving' && DEBUG) {
      push();
      stroke(PAL[6]);
      strokeWeight(D.S);
      line(this.pos.x * D.S, this.pos.y * D.S, this.dest.x * D.S, this.dest.y * D.S);
      stroke(255);
      line(this.pos.x *D.S, this.pos.y*D.S, this.pos.x*D.S, this.pos.y*D.S-this.pos.h*D.S);
      pop();
    }

  }

  this.findClosestSeed = () => {
    closest = {pos: new Vector(Infinity, Infinity)}
    for (let a of game.seeds)
    if(this.pos.dist(a.pos) < this.pos.dist(closest.pos)) {
      closest = a;
    }
    if(closest.pos.x == Infinity) return false;
    return closest;
  }

  this.target = (target) => {
    this.state = 'targeting';
    if(target == 'random seed') {
      if(game.seeds.length) {
        this.seed = random(game.seeds);
        this.seed.targeted = true;
        this.dest = new Vector(this.seed.pos.x, this.seed.pos.y);
      } else this.target('random');
    } else if(target == 'seed') {
      if(game.seeds.length) {
        this.seed = this.findClosestSeed();
        if(!this.seed) this.target('random');
        else {
          this.seed.targeted = true;
          this.dest = new Vector(this.seed.pos.x, this.seed.pos.y);
        }
      } else this.target('random');
    } else if(target == 'random') {
      let v = new Vector();
      v.randomize(25, 100);
      this.dest = new Vector(this.pos.x, this.pos.y);
      this.dest.add(v);
    } else if(target == 'away') {
      let mouse = new Vector(mouseX/D.S, mouseY/D.S);
      this.dest = new Vector(0,0);
      this.dest.add(this.pos);
      this.dest.sub(mouse);
      this.dest.mult(4);
      this.dest.limit(75);
      let r = new Vector();
      r.randomize(0, 20);
      this.dest.add(r);
      this.dest.add(this.pos);
      this.seed.targeted = false;
      this.seed = false;
      this.fleeing = true;
    } else {
      return;
    }
    this.vel = new Vector();
    this.vel.add(this.dest);
    this.vel.sub(this.pos);
    this.vel.normalize();
    this.vel.mult(2);

    if(this.pos.dist(this.dest) > 50) this.vel.h = this.pos.dist(this.dest)/20;

  }
  this.target('random seed');

  this.mouseNear = () => {
    let m = new Vector(mouseX/D.S, mouseY/D.S);
    return m.dist(this.pos) < 25
  }

}

function Seed(x, y, game) {
  this.type = 'seed';
  this.targeted = false;
  this.health = floor(random(2, 4));
  this.dead = false;
  this.h = 2;
  this.pos = new Vector(x,y, 50);
  this.vel = new Vector();
  this.vel.randomize(0.5,5);
  this.t = floor(Math.random() * 3);
  game.actors.push(this);

  this.update = () => {
    this.vel.h -= 1;
    this.vel.mult(0.90);
    this.pos.add(this.vel);

    if(abs(this.vel.h) < 0.5) this.vel.h = 0;
    else if(this.pos.h < 0) {
      this.pos.h = 0;
      this.vel.h /= 2;
      this.vel.h *= -1;
    }

    if(this.health <= 0) {
      game.remove(this);
      this.dead = true;
    }
  }

  this.draw = () => {
    this.t += this.vel.mag();
    this.t %= 4;

    let layer = floor((this.pos.y)/4);
    lset(layer > 0 ? layer % 60 : 0);

    palset([48,63,64]);
    if(this.targeted && DEBUG) palset([48,6,64]);

    spr(Math.floor(this.t) + 10, this.pos.x, this.pos.y - this.pos.h - this.h);

    if(this.pos.x > 400 || this.pos.x < -0 || this.pos.y > 240 || this.pos.y < -0) {
      game.remove(this);
    }
  }
}

// ----------

function Vector(x, y, h) {
  this.h = h || 0;
  this.x = x || 0;
  this.y = y || 0;

  this.randomize = (min, max) => {
    min = max ? min:0;
    max = max || min;
    let a = Math.random() * Math.PI * 2;
    this.x = Math.cos(a);
    this.y = Math.sin(a) * 0.60;
    this.mult(Math.random() * (max-min) + min);
  }
  this.add = (v, y, h) => {
    let x = v;
    if(!y && v.add) {
      x = v.x;
      y = v.y;
      h = v.h;
    }
    this.x += x;
    this.y += y;
    this.h += h || 0;
  }
  this.sub = (v) => {
    this.x -= v.x;
    this.y -= v.y;
  }
  this.mult = (c) => {
    this.x *= c;
    this.y *= c;
  }
  this.mag = () => {return Math.sqrt(this.x*this.x + this.y*this.y);}
  this.normalize = () => {
    let v = this.norm();
    this.mult(0);
    this.add(v);
  }
  this.norm = () => {
    let mag = this.mag();
    return new Vector(this.x/mag, this.y/mag);
  }
  this.limit = (limit) => {
    if(this.mag() > limit) {
      this.normalize();
      this.mult(limit);
    }
  }
  this.dist = (v) => {
    let x = abs(this.x - v.x);
    let y = abs(this.y - v.y);
    return Math.sqrt(x*x + y*y);
  }
}

window.addEventListener('mousedown', e => {
  if( !pause_Button_.paused && drawFN && drawFN.mousedown) {
    drawFN.mousedown(e);
  }
});
