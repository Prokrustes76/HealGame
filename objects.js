class Obj {
    constructor() {
        this.clickable = true
    }

    amIHovered() {
        return  mouse.x >= this.pos.x 
             && mouse.x <= this.pos.x + this.pos.w
             && mouse.y >= this.pos.y 
             && mouse.y <= this.pos.y + this.pos.h
    }

    wasIClicked() {
        if (!this.amIHovered()) return
        if (!this.clickable) return
        if (this instanceof Hero)
            priest.healTarget = this
        if (this instanceof Talent || this instanceof Button)
            this.clicked()
    }

    showInfo() {
        if (!this.hasInfo || !this.amIHovered()) return
 
        write(this.getText(), 500, 755, 20, '#777', 'center', true)
        write(this.name,      500, 725, 25, 'goldenrod', 'center')
  
    }

    getText() {
        if (this instanceof Talent)
            if (this.name == 'Smite') 
                return `Smites the enemy for ${game.spells[1].power}.`
            if (this.name == 'Atonement') 
                return `Your smites heal the most injured hero for ${[33, 67, 100, 100][this.level]}% of its damage.`
            if (this.name == 'Fortitude') 
                return `Increases all heroes' health by 40 points.`
            if (this.name == 'Meditate') 
                return `Allows ${[17, 33, 50, 50][this.level]}% of your mana regenration while casting.`
            if (this.name == 'Mental Strength') 
                return `Increases your healpower by ${[2.5, 5, 7.5, 7.5][this.level]}.`
            if (this.name == 'Word of Shadow') 
                return `Places a DoT on the enemy which also allows Atonement.`
            if (this.name == 'Inner Focus') 
                return `Your next spell won't cost mana and the power is increased by 50%.`

            if (this.name == 'Renew') 
                return `Places a HoT on a hero which heals 5 times for ${game.spells[2].ticPower}.`
            if (this.name == 'Replenishment') 
                return `Increases the HoT of your Renew slightly and adds an instant heal.`
            if (this.name == 'Holy Nova') 
                return `A cheap heal which heals all members for ${game.spells[4].power}.`
            if (this.name == 'Concentration') 
                return `Increases your spirit by ${[7, 13, 20, 20][this.level]}.`
            if (this.name == 'Slow Enemy') 
                return `Decreases your enemy's haste by ${[8, 16, 24, 24][this.level]}.`
            if (this.name == 'Mending') 
                return `A cheap heal which jumps to another hero after healing.`
            if (this.name == 'Holy Ground') 
                return `All heroes are healed constantly every 3 sec.`

            if (this.name == 'Lesser Heal') 
                return `Heals a single hero for ${game.spells[0].power}.`
            if (this.name == 'Borrow Time') 
                return `Increases your haste by ${[8, 16, 24, 24][this.level]}.`
            if (this.name == 'Sparkling') 
                return `Adds a HoT to your Lesser Heal.`
            if (this.name == 'Holy Shield') 
                return `This instant spell protects the hero from harm.`
            if (this.name == 'Inspiration') 
                return `This buff increased all heroe's armor.`
            if (this.name == 'Binding Heal') 
                return `Heals a hero and the priest for ${game.spells[3].power}.`
            if (this.name == 'Serenity') 
                return `This powerful instant spell heals one target for ${game.spells[6].power}.`

    }
}

class Button extends Obj{
    constructor(i) {
        super()
        this.id         = i
        this.mode       = [1, 0, 1][i]
        this.pos        = [{x: 390, y: 580, w: 220, h: 46},
                           {x: 900, y: 60, w: 90,  h: 40},
                           {x: 900, y: 60, w: 90,  h: 40}][i]
        this.backGround = '#111'
        this.color      = ['red', '#50C878', '#50C878'][i]
        this.text       = ['Delete All', 'Talents', 'Resume'][i]
        this.size       = [25, 20, 20][i]
    }
    clicked() {
        if (this.id == 0) {
            priest.talentPoints += priest.talents.reduce((a, b) => a + b.level, 0)
            priest.spells = []
            for (let talent of priest.talents)
                talent.level = 0
        }
        if (this.id == 1 || this.id == 2) {
            if (priest.spells.length) {
                game.talentMode = !game.talentMode
            }
        }
        game.createObjects()
    }

    show() {
        let backGround = this.id == 1 && priest.talentPoints ? 'darkgreen' : this.backGround
        rect(this.pos.x, this.pos.y, this.pos.w, this.pos.h, backGround)
        write(this.text, this.pos.x + this.pos.w / 2, this.pos.y + this.pos.h / 2, this.size, this.color)
    }
}