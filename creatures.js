class Creature extends Obj {
    constructor() {
        super()
        this.clickable  = true
        this.alive      = true
        this.awake      = true
        this.damDone    = 0
        this.damTaken   = 0
        this.nextAttack = game.time + Math.random() * 150
        this.shielded   = [0, -1]
        this.abilities  = []
        this.HoTs       = []
        this.target
    }

    makeStats() {
        if (!this.alive) return

        this.hpCurr = this._hpCurr
        this.hpFull = this._hpFull
        this.dam    = this._dam
        this.def    = this._defend
        this.rs     = this._rs
        this.crit   = this._crit
        this.haste  = this._haste  
        this.threat = this._threat

        if (this instanceof Enemy) {
            this.haste -= priest.slowEnemy
            return
        }

        if (this.class == 'Priest') {
            this.manaCurr = this.manaCurr || this._manaCurr 
            this.manaFull = this._manaFull 
            this.spirit   = this._spirit   
            this.power    = this._power   
        }
        if (game.buffs.includes("Fortitude")) {
            this.hpFull += 40
            this.hpCurr += 40
        }

        if (priest.inspiration)
          this.rs = this._rs + (100 - this.rs) * priest.inspiration / 100
    }

    show() {
        let ratio = 1 - this.hpCurr / this.hpFull
        
        if (this == priest.healTarget) 
            rect(this.pos.x - 2, this.pos.y - 2, this.pos.w + 4, this.pos.h + 4, 'yellow')

        ctx.drawImage(this.image, this.pos.x, this.pos.y, this.pos.w, this.pos.h)
        rect(this.pos.x, this.pos.y, this.pos.w, this.pos.h * ratio, 'rgba(136, 8, 8, .6)')
        
        this.showHoTs()

        if (this.shielded[0] > 0) {
            ctx.drawImage(images[14], this.pos.x - 10, this.pos.y - 10, this.pos.w + 20, this.pos.h + 20)
            write(Math.ceil(this.shielded[0]), this.pos.x + 50, this.pos.y + this.pos.h - 10, 16, 'white')
        }

        if (!this.alive) {
            rect(this.pos.x, this.pos.y, this.pos.w, this.pos.h, 'rgba(0, 0, 0, .4)')
            ctx.drawImage(images[5], this.pos.x + 15, this.pos.y + 15, 70, 102)
        }

        this.showHealthAndMana()
    }

    showHoTs() {
        for (let i = 0; i < this.HoTs.length; i++) {
            ctx.drawImage(this.HoTs[i].spell.image, this.pos.x + i * 20, this.pos.y, 25, 25)
            write(this.HoTs[i].tics.length, this.pos.x + i * 20 + 12, this.pos.y + 14, 25, 'black')
        }   
    }

    showHealthAndMana() {
        let ratio = this.hpCurr / this.hpFull
        rect(this.pos.x, this.pos.y + this.pos.h , this.pos.w,         15, '#8A0303')
        rect(this.pos.x, this.pos.y + this.pos.h , this.pos.w * ratio, 15, '#355E3B')
        let text = `${Math.floor(this.hpCurr)} / ${Math.floor(this.hpFull)}`
        write(text, this.pos.x + this.pos.w / 2, this.pos.y + this.pos.h + 8, 14, 'yellow')

        if (this.class != 'Priest') return
        ratio = this.manaCurr / this.manaFull
        rect(this.pos.x, this.pos.y + this.pos.h + 15, this.pos.w,         15, 'royalblue')
        rect(this.pos.x, this.pos.y + this.pos.h + 15, this.pos.w * ratio, 15, 'blue')
        text = `${Math.floor(this.manaCurr)} / ${Math.floor(this.manaFull)}`
        write(text, this.pos.x + this.pos.w / 2, this.pos.y + this.pos.h + 23, 14, 'yellow')
    }

    action() {
        this.checkStuff()
        
        if (this.class == 'Priest')
            this.doPriestStuff()
        
        if (game.time >= this.nextAttack)
            this.attack()
    }

    checkStuff() {
        this.makeStats()

        if (this.HoTs.length)
            this.checkHoTs()

        if (priest.abilities.some(a => a.name == 'Shield' && this.shielded[1] < game.time)) {
            priest.spells.find(s => s.name == 'Shield').overHeal += this.shielded[0]
            this.shielded = [0, 0]
        }
    }

    checkHoTs() {
        for (let HoT of this.HoTs)
            if (HoT.tics[0].time <= game.time) {
                HoT.spell.heal(this, HoT.tics[0].amount)
                HoT.tics.splice(0, 1)
                if (HoT.tics.length == 0) 
                    this.HoTs.splice(this.HoTs.indexOf(HoT), 1)
            }
    }

    defend() {
        return this.defend >= rand(0, 100)
    }

    canCrit() {
        return this.crit >= rand(0, 100)
    }

    isHurt(dam) { if (this instanceof Enemy) 
        this.damTaken += dam
        dam *= (1 - this.rs / 100)

        if (this.shielded[0]) {
            priest.spells.find(s => s.name == 'Shield').healed += Math.min(this.shielded[0], dam)
            if (this.shielded[0] > dam) {
                this.shielded[0] -= dam
                dam = 0
            }
            else {
                dam -= this.shielded[0]
                this.shielded[0] = 0
            }
        }

        this._hpCurr -= dam

        if (this.hpCurr <= 0) 
            this.isDead()
        
        this.checkStuff()
    }

    isDead() {
        this._hpCurr = this.hpCurr = 0

        if (this instanceof Enemy) {
            game.enemies.splice(game.enemies.indexOf(this), 1)
            game.createObjects()
            for (let h of game.heroes)
                h.target = undefined
            return
        }

        this.alive  = false
        if (this.class == 'Priest')
            game.running = false 

        this.HoTs   = []

        if (priest.isCasting >= 0 && priest.spell.target == this)
        priest.spellAborted()
    }

    attack() {
        if (this == priest || (this instanceof Hero && game.enemies.length == 0))
            return

        if (this.aoe && rand(0, 100) < this.aoe) {
            let list = game.heroes.filter(h => h.alive)
            for (let hero of list)
                this.applyDamage(hero, [0, 1.1, .6, .45, .38, .34][list.length])
        }
        else 
            this.applyDamage(this.findTarget())
        
        this.nextAttack = game.time + 90 * (1- this.haste/100)
    }

    applyDamage(target, factor = 1, dam) {
        if (target.defend()) return

        dam = (dam || this.dam)  * rand() * factor
        if (this.canCrit()) dam *= 2
        this.damDone += dam
        target.isHurt(dam)
    }

    isHealed(amount, spell) {
        let diff = this.hpFull - this.hpCurr
        if (amount - diff > 0) {
            spell.overHeal += amount - diff
            this._hpCurr = this._hpFull
        }
        else
            this._hpCurr += amount
    }
}

class Hero extends Creature {
    constructor(i, alive, awake, damDone, damTaken) {
        super(alive, awake, damDone, damTaken)
        this.id         = i
        this.name       = ['Olof'   , 'Ferin', 'Luna',  'Lagoth', 'Armen' ][i]
        this.class      = ['Warrior', 'Rogue', 'Druid', 'Mage',   'Priest'][i]
        this.xp         = 0
        this.level      = 1
        this._hpCurr    = [  550   ,   480   ,  460  ,   380  ,  400][i]
        this._defend    = [  10    ,    12   ,    7  ,     0  ,    0][i]
        this._rs        = [  36    ,    24   ,   22  ,    18  ,   20][i]
        this._dam       = [  40    ,    40   ,   42  ,    60  ,    0][i]
        this._haste     = [  10    ,    22   ,   13  ,     0  ,    0][i]
        this._crit      = [   5    ,    15   ,    8  ,     8  ,    5][i]
        this._threat    = [ 100    ,    20   ,   22  ,    30  ,   25][i]
        this._hpFull    = this._hpCurr
        
        this.image      = images[i]
        this.color      = 'forestgreen'
        this.pos        = {
                            x: 190 + i * 130,
                            y: 330,
                            w: 100,
                            h: 150}

        if (this.class == 'Priest') {
            this._manaCurr      = 600
            this._manaFull      = 600
            this._spirit        =  50
            this._power         =  40
            this.CD             =  90
            this.nextRegen      =   0
            this.nextFullReg    =   0
            this.combatReg      =   0
            this.nextSpell      = -1000
            this.healTarget     = game.heroes[0]
            this.isCasting      = -1
            this.spells         = []
            this.talents        = []
            this.spell          = undefined
            this.talentPoints   = 2
            this.atonement      = 0
            this.slowEnemy      = 0
            this.inspiration    = 0

            for (let i = 0; i < 21; i++)
                	this.talents.push(new Talent(i))
            
            this.abilities = [...this.spells]
        }
    }

    findTarget() {
        return this.target || game.enemies[0]
    }
    
    doPriestStuff() {
        if (game.time >= this.nextRegen)
            this.manaRegen()

        if (this.isCasting >= 0)
            if (game.time >= this.spellFinished) {
                this.spell.execute()
                this.spell = undefined
                this.isCasting = -1
            }
    }

    manaRegen() {
        let factor = game.time < this.nextFullReg ? this.combatReg : 1
        this.manaCurr  += factor * this.spirit / 2
        if (this.manaCurr > this.manaFull) 
            this.manaCurr = this.manaFull
        this.nextRegen = game.time + 150
    }

    newSpellStarted(spell) {
        this.spell         = spell
        this.isCasting     = game.time
        this.spellFinished = game.time + spell.duration * (1 - this.haste/100)
    }

    spellAborted() {
        this.isCasting = -1
    }

    talentMode() {
        rect(0, 0, 1000, 800, 'black')
        rect(390, 154, 220, 46, '#111')
        for (let i = 0; i < 3; i++)
            rect(140 + 250 * i, 230, 220, 320, '#111')
        for (let obj of game.objects) {
            obj.show()
            obj.showInfo()
        }
        write(`Talent Points: ${this.talentPoints}`, 500, 178, 25, 'goldenrod')
    }

}

class Enemy extends Creature {
    constructor(i, alive, awake, damDone, damTaken) {
        super(alive, awake, damDone, damTaken)
        this.id         = i
        this.class      = ['Ogre', 'Troll', 'Wolf', 'Lizard', 'Skeleton'][i]
        this.value      = [  100   ,    80   ,   40  ,    70  ,   60][i]
        this._hpCurr    = [ 4900   ,  4300   , 2300  ,  3300  , 2800][i]
        this._defend    = [    5   ,     7   ,   10  ,     5  ,   10][i]
        this._rs        = [   20   ,    22   ,   15  ,    30  ,   24][i]
        this._dam       = [   62   ,    58   ,   40  ,    42  ,   55][i]
        this._haste     = [    5   ,    10   ,   20  ,    10  ,   15][i]
        this._crit      = 0
        this._hpFull    = this._hpCurr
        this.aoe        = [   25   ,    10   ,    5  ,    20  ,   10][i]
        
        this.image      = images[i + 6]
        this.color      = 'darkgreen'
    }

    static findPosition() {
        let len  = game.enemies.length 
        for (let i = 0; i < len; i++)
        game.enemies[i].pos = { x: -95 * (len - 1) + 420 + i * 190,
                                y: 20,
                                w: 160,
                                h: 250 }
    }

    findTarget() {
        let list = game.heroes.filter(h => h.alive)
        let accThreat   = 0
        let amount      = rand(0, list.reduce((a, b) => a + b.threat, 0))
        for (let hero of list) {
            accThreat += hero.threat
            if (accThreat >= amount)
                return hero
        }
    }
}