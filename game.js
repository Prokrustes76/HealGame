let ctx,
    game,
    mouse   = {x: -1, y: -1},
    images  = [],
    sounds  = [],
    keys    = [],
    priest

class Game {
    constructor() {
        this.time           = 0
        this.timeFast       = 0
        this.running        = true
        this.paused         = false
        this.heroes         = []
        this.enemies        = []
        this.objects        = []
        this.buffs          = []
        this.buttons        = []
        this.spells         = []
        this.nextEnemy      = 0
        this.tillNextEnemy  = 60 
        this.talentMode     = true
        this.nextTalentAt   = 3000
        this.talents
    }

    init() {
        for (let i = 0; i < 5; i++)
            this.heroes.push(new Hero(i))

        for (let i = 0; i < 3; i++)
            this.buttons.push(new Button(i))
          
        for (let i = 0; i < 7; i++)
            this.spells.push(new Spell(i)) 

        priest = game.heroes.find(h => h.class == 'Priest')
        Ability.findPos()
            
        this.createObjects()
        loop()
    }

    createObjects() {
        if (game.talentMode)
            this.objects = [...priest.talents]
        else
            this.objects = [...this.heroes, ...this.enemies, ...priest.abilities]

        for (let button of game.buttons)
            if (button.mode == this.talentMode)
                this.objects.push(button)

    }

    action() {
        if(++this.timeFast % 2 != 0) return
        
        if (this.talentMode) {
            priest.talentMode()
            return
        }

        this.logic()
        this.show()
    }

    logic() {
        if (!this.running || this.paused) return

        this.time++
        if (this.time >= this.nextEnemy)
            this.pushNewEnemy()

        if (this.time >= this.nextTalentAt)
            this.newTalentPoint()

        Ability.checkIfAbilityIsEssayed()

        for (let o of this.objects)
            if (o.alive)
                o.action()
    }

    newTalentPoint() {
        this.nextTalentAt += 3000
        priest.talentPoints++
    }

    pushNewEnemy() {
        this.enemies.push(new Enemy(0))
        this.tillNextEnemy *= .95
        this.nextEnemy += this.tillNextEnemy * 60
        Enemy.findPosition()
        this.createObjects()
    }

    showNextMonster() {
        rect(900, 10, 90, 40, '#111')
        let x = 1 - ((this.nextEnemy - game.time) / (game.tillNextEnemy * 60))
        write('Next Enemy', 945, 30, 15, '#666')
        ctx.drawImage(images[15], 990 - x * 90, -2, 40, 60)
        rect(990, 10, 10, 40, '#000')
    }

    showPaused() {
        rect(0, 0, 1000, 800, 'rgba(0, 0, 0, .4')
        write('PAUSE', 500, 150, 120, 'ORANGE')
    }

    show() {
        rect(0, 0, 1000, 800, '#000')
        rect(priest.spells[0].pos.x - 10, priest.spells[0].pos.y - 10, 
             priest.spells.length * 70 + 15, 80, '#151515')

        Ability.showBalken()
        this.showNextMonster()

        for (let o of this.objects) {
            o.show()
            o.showInfo()
        }

        if (this.paused) this.showPaused()
    }
}

document.addEventListener('mousemove', mouseMove)
document.addEventListener('mousedown', mouseDown)
document.addEventListener('keydown', keyDown)
document.addEventListener('keyup', keyUp)

function mouseMove(e) {
    mouse.x = e.clientX
    mouse.y = e.clientY
}

function mouseDown() {
    for (let object of game.objects)
        object.wasIClicked()
}

function keyDown(e) {
    if (e.key == 'p') {
        game.paused = !game.paused
        return
    }

    if (e.key == 'Escape') 
        priest.spellAborted()

    if (!keys.includes(e.key))
        keys.push(e.key)
}

function keyUp(e) {
    keys.splice(keys.indexOf(e.key), 1)
}

window.onload = function() {
    ctx = document.getElementById('C').getContext('2d')
    ctx.textBaseline = 'middle'

    loadImages()

    game = new Game()
    game.init()
}

function loadImages(i = 0) {

    let list = ['img0',   'img1',   'img2',   'img3',  'img4', 
                'img5',   'img6',   'img7',   'heal0', 'heal1', 
                'heal2',  'heal3',  'heal4',  'heal5', 'bubble', 
                'arrow',  'tal0',   'tal1',   'tal2',  'tal3',
                'tal4',   'tal5',   'tal6',   'tal7',  'tal8',
                'tal9',   'tal10',  'tal11',  'tal12', 'tal13',
                'tal14',  'tal15']
    if (i >= list.length) return


    images.push(new Image())
    images[i].src = `./rsc/${list[i]}.png`
    images[i].onload = loadImages(++i)
}

function loop() {
    game.action()
    requestAnimationFrame(loop)
}


