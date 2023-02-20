class Ability extends Obj{
    constructor() {
        super()
        this.nextUse    = -1
        this.level      =  1
        this.healed     =  0
        this.overHeal   =  0
        this.target     =  game.heroes[0]
        this.clickable  = true
    }

    static findPos() {
        for (let i = 0; i < priest.spells.length; i++) {
            priest.spells[i].pos = {
                x: 507 - priest.spells.length * 37 + 74 * i, 
                y: 620,
                w: 60,
                h: 60
            }   
        }
    }

    static showBalken() {
        if (priest.isCasting < 0) return 

        rect(250, 540, 500, 30, '#333')
        rect(255, 545, 490, 20, '#151515')
        let dura = priest.spell.duration * ( 1 - priest.haste / 100)
        let ratio = 1 - (priest.spellFinished - game.time) / dura
        let text = `${Math.round((game.time - priest.isCasting) / 6) / 10} / ${dura / 60}sec`
        rect(255, 545, 490 * ratio, 20, 'orange')
        ctx.drawImage(priest.spell.image, 255, 545, 20, 20)
        write(priest.spell.name, 280, 556, 18, 'white', 'left')
        write(text, 500, 556, 18, 'white', 'center')
    }

    static checkIfAbilityIsEssayed() {
        for (let ability of priest.abilities)
            if (keys.includes(ability.key))
                ability.isEssayed()
    }

    static findLowestHero() {
        let low = [-1, 1.01]
        for (let i = 0; i < game.heroes.length; i++) {
            let ratio = game.heroes[i].hpCurr / game.heroes[i].hpFull
            if (game.heroes[i].alive && ratio < low[1])
                low = [i, ratio]
        }
        return game.heroes[low[0]]
    }

    show(x = this.pos.x, y = this.pos.y, w = this.pos.w, h = this.pos.h) {
        ctx.drawImage(this.image, x, y, w, h)
        if (x !=this.pos.x) return

        if (!this.spellIsPossible())
            rect(x, y, w, h, 'rgba(0, 0, 0, .8)')
        if (this.nextUse > game.time)
            write(Math.ceil((this.nextUse - game.time)/60), x + 30, y + 32, 40, 'white')

    }

    isEssayed() {
        if (this.spellIsPossible())
            this.startSpell()
    }

    spellIsPossible() {
        if (!priest.healTarget.alive)                     return false
        if (priest.isCasting >= 0)                        return false
        if (game.time < this.nextUse)                     return false
        if (game.time < priest.nextSpell)                 return false
        if (priest.manaCurr < this.manaCost)              return false
        if (!game.enemies.length && this.name == 'Smite') return false

        return true
    }

    startSpell() {
        this.target = priest.healTarget
        if (this.duration == 0)
            this.execute()
        else 
            priest.newSpellStarted(this)
    }

    execute() {
        if (this.name == 'Smite' && !game.enemies.length) return
        priest.manaCurr -= this.manaCost
        this.nextUse     = game.time + this.CD * 60

        if (this.manaCost > 0)
            priest.nextFullReg = game.time + 300

        if (this.duration == 0)
            priest.nextSpell = game.time + priest.CD

        if (this.ticAmount > 0)
        this.placeHoTs()
        
        if (['Shield', 'Smite'].includes(this.name))
            this.specialHeals()
    
        else this.whoIsHealed()
    }

    specialHeals() {
        if (this.name == 'Shield') 
            priest.healTarget.shielded = [this.power * priest.power / 40, game.time + 30 * 60]

        if (this.name == 'Smite') {
            priest.applyDamage(priest.findTarget(), 1, this.power * priest.power / 40)
            if (priest.atonement)
                this.heal(Ability.findLowestHero(1))
        }
    }

    placeHoTs() {
        let idx = this.target.HoTs.indexOf(this.target.HoTs.find(h => h.spell.name == this.name))
        if (idx >= 0) this.target.HoTs.splice(idx, 1)
        let obj = {
            spell:  this,
            tics:   []
        }

        for (let time = this.ticBetween * (1 - priest.haste/ 100); time <= this.ticAmount * this.ticBetween; time+= this.ticBetween* (1 - priest.haste/ 100))
            obj.tics.push(Math.floor(time * 60 + game.time))
        
        this.target.HoTs.push(obj)
    }

    whoIsHealed() {
            if (this.name == 'Binding Heal') {
                this.heal(this.target)
                this.heal(priest)
            }
            else if (this.amount == 1) 
                this.heal(this.target)
            else
                for (let i = 0; i < this.amount; i++)
                    this.heal(game.heroes[i]) 
    }

    heal(target, fromHoT) {
        if (!target.alive) return
        let amount = (fromHoT ? this.ticPower : this.power) * rand() * (priest.power / 40)
        if (this.name == 'Smite') amount *= priest.atonement

        this.healed += amount
        target.isHealed(amount, this)
    }
}

class Spell extends Ability {
    constructor(i) {
        super()
        this.name       = ['Lesser Heal',   'Smite'  , 'Renew' , 'Binding Heal', 'Holy Nova', 'Shield', 'Serenity'][i]
        this.manaCost   = [    55       ,     45     ,    60   ,       80      ,      60    ,    65   ,    60     ][i]
        this.CD         = [     0       ,      0     ,     0   ,        0      ,      15    ,    10   ,    30     ][i]
        this.power      = [   150       ,    135     ,     0   ,      110      ,      50    ,   180   ,   300     ][i]
        this.duration   = [   120       ,    120     ,     0   ,       90      ,       0    ,     0   ,     0     ][i]
        this.ticPower   = [    10       ,      0     ,    25   ,        0      ,       0    ,     0   ,     0     ][i]
        this.ticAmount  = [     0       ,      0     ,     5   ,        0      ,       0    ,     0   ,     0     ][i]
        this.ticBetween = [     0       ,      0     ,     3   ,        0      ,       0    ,     0   ,     0     ][i]
        this.key        = [    'A'      ,     '2'    ,    'w'  ,       'y'     ,      'q'   ,    '4'  ,    '1'    ][i]
        this.amount     = [     1       ,      1     ,     1   ,        2      ,       5    ,     1   ,     1     ][i]
        this.image      = images[[8, 23, 10, 11, 12, 13, 22][i]]
    }
}

class Talent extends Ability {
    constructor(i) {
        super()
        this.id         = 1
        this.hasInfo    = true
        this.name       = ['Smite',       'Atonement',     'Fortitude',   'Meditate',      'Mental Strength', 'Word of Shadow', 'Inner Focus',
                           'Renew'      , 'Replenishment', 'Holy Nova',   'Concentration', 'Slow Enemy',      'Mending',        'Holy Ground',
                           'Lesser Heal', 'Borrow Time',   'Sparkling',   'Holy Shield',   'Inspiration',     'Binding Heal',   'Serenity'][i]
        this.column     = Math.floor(i / 7)
        this.row        = [0, 0, 1, 1, 2, 2, 2][i % 7]
        this.image      = images[[23, 29, 17, 18, 27, 16, 20,
                                  10, 30, 12, 31, 24, 19, 25,
                                   8, 21, 28, 13, 26, 11, 22][i]]
        this.level      = 0
        this.maxLevel   = [1, 3, 4, 8, 10, 11, 15, 16, 18].includes(i) ? 3 : 1
        this.pos        = {
            x:  [193, 257, 193, 257, 161, 225, 289][i % 7] + 250 * this.column,
            y:  (this.row) * 110 + 250,
            w:  50,
            h:  50
        }
    }

    isAvailable() {
        if (!['Smite', 'Renew', 'Lesser Heal'].includes(this.name) && !priest.talents.filter(t => t.level > 0).length) return false
        if (this.name == 'Sparkling'     && priest.talents.find(t => t.name == 'Lesser Heal').level == 0)              return false
        if (this.name == 'Replenishment' && priest.talents.find(t => t.name ==       'Renew').level == 0)              return false

        let matrix = [[0, 0, 0], 
                      [0, 0, 0], 
                      [0, 0, 0]]

        priest.talents.forEach(t => matrix[t.row][t.column] += t.level)

        if (this.row == 0) return true
        if (this.row == 1 && matrix[0].some(m => m >= 3)) return true
        if (this.row == 2 && matrix[1].some(m => m >= 3)) return true
        return false
    }

    show(x = this.pos.x, y = this.pos.y, w = this.pos.w, h = this.pos.h) {
        ctx.drawImage(this.image, x, y, w, h)
        if (!this.isAvailable())
            rect(x, y, w, h, 'rgba(0, 0, 0, .8')
        let col = this.maxLevel - this.level == 0 ? '#1eff1e' : this.level == 0 ? '#555' : 'yellow'
        write(`${this.level}/${this.maxLevel}`, x + w/2, y + h + 13, 18, col)
    }

    clicked() {
        if (this.level == this.maxLevel || priest.talentPoints == 0 ||!this.isAvailable()) return

        this.level++
        priest.talentPoints--

        if (this.name == 'Fortitude')       game.buffs.push('Fortitude')
        if (this.name == 'Meditate')        priest.combatReg += 1/6
        if (this.name == 'Lesser Heal')     priest.spells.push(new Spell(0))
        if (this.name == 'Smite')           priest.spells.push(new Spell(1))
        if (this.name == 'Renew')           priest.spells.push(new Spell(2))
        if (this.name == 'Binding Heal' )   priest.spells.push(new Spell(3))
        if (this.name == 'Holy Nova')       priest.spells.push(new Spell(4))
        if (this.name == 'Holy Shield')     priest.spells.push(new Spell(5))
        if (this.name == 'Serenity')        priest.spells.push(new Spell(6))
        if (this.name == 'Atonement')       priest.atonement =        1/6 * this.level
        if (this.name == 'Concentration')   priest._spirit   = 50 +  20/3 * this.level
        if (this.name == 'Mental Strength') priest._power    = 40 +   2.5 * this.level
        if (this.name == 'Slow Enemy')      priest.slowEnemy =          8 * this.level
        if (this.name == 'Inspiration')     priest.inspiration =     10/3 * this.level
        if (this.name == 'Borrow Time')     priest._haste =             8 * this.level

        if (this.name == 'Replenishment') {
            let renew = priest.spells.find(s => s.name == 'Renew')
            renew.ticPower += 5
            renew.power += 10
        }
        
        if (this.name == 'Sparkling') {
            let lesser = priest.spells.find(s => s.name == 'Lesser Heal')
            lesser.ticAmount  = 3
            lesser.ticBetween = 2
            lesser.ticPower   = this.level * priest.spells[0].power / 20
        }

        priest.abilities = priest.spells
        Spell.findPos()
    }
}