"use strict";

function standardDamageFormula(offense, defense) {
    if (offense > defense)
        return offense * (1 + Math.pow(1 - defense / offense, 0.5) * 0.2)
    else
        return offense * Math.pow(offense / defense, 1.5)
}

function getNumericValue(name) {
    return document.getElementById(name).valueAsNumber
}
function setElementValue(name, value) {
    document.getElementById(name).value = value;
}

function getRadioValue(name) {
    for (let elem of document.querySelectorAll(`input[name=${name}]`)) {
        if (elem.checked) {
            return elem.value
        }
    }
}

function getCheckboxValue(name) {
    return document.getElementById(name).checked
}

function updateValue(...args) {
    switch (args[0]) {
        case "playerStat":
            playerStats[args[1]] = getNumericValue("playerStat_" + args[1])
            break;
        case "enemyStat":
            enemyStats[args[1]] = getNumericValue("enemyStat_" + args[1])
            break;
        case "atkDmgFactor":
            baseDamageFactor = getNumericValue("atkDmgFactor")
            break;
        case "dmgType":
            skillBonusType = getRadioValue("dmgType");
            break;
        case "mod":
            modifiers[args[1]] = getNumericValue(args[1]) / 100;
            break;
    }
}

function updateAllValues() {
    updateValue("playerStat", "atk");
    updateValue("playerStat", "def");
    updateValue("playerStat", "foc");

    updateValue("mod", "brawler");
    updateValue("mod", "shooter");
    updateValue("mod", "bullseye");
    updateValue("mod", "berserk");
    updateValue("mod", "crossCounter");
    updateValue("mod", "bouncer");
    updateValue("mod", "momentum");
    updateValue("mod", "markRush");
    updateValue("mod", "statusRush");

    updateValue("enemyStat", "atk");
    updateValue("enemyStat", "def");
    updateValue("enemyStat", "foc");

    updateValue("atkDmgFactor");
    updateValue("dmgType");

    applyBerserk = getCheckboxValue("applyBerserk");
    applyBouncer = getCheckboxValue("applyBouncer");
    applyCrossCounter = getCheckboxValue("applyCrossCounter");
    applySergeyHax = getCheckboxValue("applySergeyHax");
    applyMark = getCheckboxValue("applyMark");

    paramDamageFactor = getNumericValue("enemyDmgFactor");

    elemResist = getNumericValue("elemResist");
    shieldStrength = getNumericValue("shieldStrength");
    stateDmgFactor = getNumericValue("breakWeakness");

    damageMod = shieldStrength * stateDmgFactor;

    dashes = getNumericValue("dashCount");
}

function getSkillBonus() {
    if (skillBonusType == "MELEE") return 1 + modifiers.brawler;
    if (skillBonusType == "RANGED") return 1 + modifiers.shooter;
    return 1;
}

//#region Equipment
let equipHead = [null];
let equipArms = [null];
let equipTorso = [null];
let equipFeet = [null];
async function loadEquipment() {
    fetch("./equipment.json").then(res => res.json()).then(data => {
        addEquipment(data)
    })
}

function addEquipment(data) {
    function createNode(equip, id) {
        let node = document.createElement("option")
        node.value = id;
        node.innerText = `${equip.name} (${equip.ascended ? "Lvl+" : `Lvl. ${equip.level}`})`
        return node;
    }
    let selectBox = document.getElementById("equipHead")
    for (let equip of data["HEAD"]) {
        selectBox.appendChild(createNode(equip, equipHead.push(equip) - 1));
    }

    selectBox = document.getElementById("equipWeaponR")
    let selectBox2 = document.getElementById("equipWeaponL")
    for (let equip of data["ARM"]) {
        let id = equipArms.push(equip) - 1;

        selectBox.appendChild(createNode(equip, id));
        selectBox2.appendChild(createNode(equip, id));
    }

    selectBox = document.getElementById("equipTorso")
    for (let equip of data["TORSO"]) {
        selectBox.appendChild(createNode(equip, equipTorso.push(equip) - 1));
    }

    selectBox = document.getElementById("equipBoots")
    for (let equip of data["FEET"]) {
        let node = createNode(equip, equipFeet.push(equip) - 1);

        selectBox.appendChild(node);
    }

    sortEquipLists();
}

function sortEquipLists() {
    function sortList(optionID, equipArray) {
        let optionRoot = document.getElementById(optionID);
        let array = Array.from(optionRoot.children);
        array.sort((a, b) => {
            a = equipArray[a.value];
            b = equipArray[b.value];

            if (!a) return -1;
            if (!b) return 1;

            return a.level - b.level;
        })

        for (let option of array) {
            optionRoot.appendChild(option);
        }
    }

    sortList("equipHead", equipHead);
    sortList("equipWeaponR", equipArms);
    sortList("equipWeaponL", equipArms);
    sortList("equipTorso", equipTorso);
    sortList("equipBoots", equipFeet);
}

function getPlayerEquipmentStats(stats) {
    function applyEquipmentSlot(slot) {
        let equip;
        switch (slot) {
            case "head":
                equip = equipHead[document.getElementById("equipHead").value];
                break;
            case "arm-r":
                equip = equipArms[document.getElementById("equipWeaponR").value];
                break;
            case "arm-l":
                equip = equipArms[document.getElementById("equipWeaponL").value];
                break;
            case "torso":
                equip = equipTorso[document.getElementById("equipTorso").value];
                break;
            case "feet":
                equip = equipFeet[document.getElementById("equipBoots").value];
                break;
        }

        if (!equip) return;

        if(equip.ascended) {
            //scale stats to level
        } else {
            stats.atk += equip.atk;
            stats.def += equip.def;
            stats.foc += equip.foc;
        }
    }

    applyEquipmentSlot("head");
    applyEquipmentSlot("arm-r");
    applyEquipmentSlot("arm-l");
    applyEquipmentSlot("torso");
    applyEquipmentSlot("feet");
}

function applyPlayerStats() {
    let stats = {
        atk: 0,
        def: 0,
        foc: 0,
    }
    
    //find player's base stats
    getPlayerEquipmentStats(stats);

    setElementValue("playerStat_atk", stats.atk);
    setElementValue("playerStat_def", stats.def);
    setElementValue("playerStat_foc", stats.foc);
}

document.getElementById("applyPlayerStats").addEventListener("click", () => {
    applyPlayerStats();
    updateAllValues();
    calculateDamage();
})
//#endregion

//#region Stats/Vars
let playerStats = {
    atk: 1,
    def: 1,
    foc: 1,
}
let enemyStats = {
    atk: 1,
    def: 1,
    foc: 1,
}

let skillBonusType = "OTHER";
let modifiers = {
    brawler: 0,
    shooter: 0,
    berserk: 0,
    momentum: 0,
    crossCounter: 0,
    bouncer: 0,
    bullseye: 0,
    markRush: 0,
    statusRush: 0
}

let baseDamageFactor = 1;
let applyDamageMods = true;
let applyBerserk = false;
let dashes = 0;
let applySergeyHax = false;
let paramDamageFactor = 1;
let damageMod = 1;
let applyElementalResist = false;
let elemResist = 1;
let applyCrossCounter = false;
let applyBouncer = false;
let partyMembers = 0;
let defenseFactor = 1;
let applyMark = false;
let shieldStrength = 0;
let stateDmgFactor = 0;
//#endregion

function calculateDamage() {
    updateAllValues();

    let damageFactor = baseDamageFactor;

    let critChance = (playerStats.foc / enemyStats.foc) ** 0.35 - 0.9;
    critChance = Math.max(0, Math.min(critChance, 1))
    if (applyDamageMods) {
        // brawler/shooter
        damageFactor *= getSkillBonus();
        // berserker
        if (applyBerserk) damageFactor *= 1 + modifiers.berserk;
        // momentum
        damageFactor *= 1 + dashes * modifiers.momentum;
        // sergey hax
        if (applySergeyHax) damageFactor *= 4096;
    }

    damageFactor *= paramDamageFactor * damageMod;

    if (applyDamageMods) {
        damageFactor *= 1 - elemResist / 100;
        if (applyMark && skillBonusType == "RANGED") damageFactor *= 1 + 0.5 * (1 + modifiers.markRush + modifiers.statusRush);
        if (applyCrossCounter) damageFactor *= 1 + modifiers.crossCounter;
        if (applyBouncer) damageFactor *= 1 + modifiers.bouncer;
        //crit damage
    }

    if (partyMembers == 1) damageFactor *= 0.8;
    if (partyMembers >= 2) damageFactor *= 0.6;

    defenseFactor = enemyStats.def;

    let damage = Math.max(1, standardDamageFormula(playerStats.atk, defenseFactor));

    damage *= damageFactor;
    document.getElementById("minDamage").innerText = Math.round(0.95 * damage);
    document.getElementById("avgDamage").innerText = Math.round(damage);
    document.getElementById("maxDamage").innerText = Math.round(1.05 * damage);

    document.getElementById("critchance").innerText = `${Math.round(critChance * 1000) / 10}%`
    document.getElementById("minDamage-crit").innerText = Math.round(0.95 * damage * (1.5 + modifiers.bullseye));
    document.getElementById("avgDamage-crit").innerText = Math.round(damage * (1.5 + modifiers.bullseye));
    document.getElementById("maxDamage-crit").innerText = Math.round(1.05 * damage * (1.5 + modifiers.bullseye));
}

for (let element of document.getElementsByTagName("input")) {
    element.addEventListener("change", calculateDamage)
}

document.getElementById("dashCountOut").innerText = getNumericValue("dashCount")

document.getElementById("dashCount").addEventListener("change", () => {
    document.getElementById("dashCountOut").innerText = getNumericValue("dashCount")
})

loadEquipment();
calculateDamage();