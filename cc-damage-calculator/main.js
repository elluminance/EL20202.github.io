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
    partyMembers = getNumericValue("partyCount");
}

function getSkillBonus() {
    if (skillBonusType == "MELEE") return 1 + modifiers.brawler;
    if (skillBonusType == "RANGED") return 1 + modifiers.shooter;
    return 1;
}

//#region Player Stat Auto-Fill
let playerBaseStats = {
    hp: {
        base: 200,
        increase: 2000,
        variance: 0.1
    },
    attack: {
        base: 20,
        increase: 200,
        variance: 0.9
    },
    defense: {
        base: 20,
        increase: 200,
        variance: 0.5
    },
    focus: {
        base: 20,
        increase: 200,
        variance: 0.3
    }
}

function calcPlayerBaseStats(stats, level) {
    function baseStatFormula(statEntry) {
        let base = statEntry.base;
        let increase = statEntry.increase;
        let variance = statEntry.variance;

        let varianceFactor = Math.sin(Math.PI * 2 * (level / 4 + variance));
        let levelFactor = ((1.25 ** (level / 10)) - 1) / (1.25 ** 10 - 1);
        let increaseFactor = Math.log(1.25) / 10 * (1.25 ** (level / 10)) / (1.25 ** 10 - 1) * increase * 0.5;

        return base + Math.floor(increase * levelFactor + varianceFactor * increaseFactor);
    }

    stats.atk = baseStatFormula(playerBaseStats.attack);
    stats.def = baseStatFormula(playerBaseStats.defense);
    stats.foc = baseStatFormula(playerBaseStats.focus);
}

//#region Equipment

let statReference = [
    {"level":1,"base":20,"hp":205},
    {"level":6,"base":23,"hp":234},
    {"level":11,"base":26,"hp":266},
    {"level":16,"base":30,"hp":303},
    {"level":21,"base":34,"hp":343},
    {"level":26,"base":38,"hp":389},
    {"level":31,"base":43,"hp":439},
    {"level":36,"base":49,"hp":496},
    {"level":41,"base":56,"hp":560},
    {"level":46,"base":63,"hp":630},
    {"level":51,"base":71,"hp":710},
    {"level":56,"base":79,"hp":798},
    {"level":61,"base":89,"hp":897},
    {"level":66,"base":100,"hp":1008},
    {"level":71,"base":113,"hp":1132},
    {"level":76,"base":127,"hp":1270},
    {"level":81,"base":142,"hp":1425},
    {"level":86,"base":159,"hp":1598},
    {"level":91,"base":179,"hp":1792},
    {"level":96,"base":200,"hp":2008},
    {"level":99,"base":215,"hp":2150},
];

function getAscendedEquipStats(equip, scaleToLevel) {
    function getAverageStat(level) {
        level = Math.max(Math.min(level, 99), 0);
        for(let i = statReference.length; --i;) {
            let levelStats = statReference[i];

            if(levelStats.level <= level) {
                if(levelStats.level == level) return levelStats.base;

                let next = statReference[i + 1];
                return next.base + (levelStats.base - next.base) * ((level - next.level) / (levelStats.level - next.level));
            }
        }
        return 1;
    }

    let factor = getAverageStat(scaleToLevel) / getAverageStat(equip.level);
    
    return {
        atk: Math.round(equip.atk * factor),
        def: Math.round(equip.def * factor),
        foc: Math.round(equip.foc * factor),
    }
}

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
        node.innerText = `${equip.name} (${equip.ascended ? "↑Lvl" : `Lvl. ${equip.level}`})`
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

const MODIFIERS = [
    "brawler",
    "shooter",
    "bullseye",
    "berserk",
    "crossCounter",
    "bouncer",
    "momentum",
    "markRush",
    "statusRush",
]

function sortEquipLists() {
    function sortList(optionID, equipArray) {
        let optionRoot = document.getElementById(optionID);
        let array = Array.from(optionRoot.children);
        array.sort((a, b) => {
            a = equipArray[a.value];
            b = equipArray[b.value];

            if (!a) return -1;
            if (!b) return 1;

            if (a.level == b.level) {
                return a.name < b.name ? -1 : 1;
            }
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

function getPlayerEquipmentStats(stats, level) {
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

        if (equip.ascended) {
            let adjustedStats = getAscendedEquipStats(equip, level);
            stats.atk += adjustedStats.atk;
            stats.def += adjustedStats.def;
            stats.foc += adjustedStats.foc;
        } else {
            stats.atk += equip.atk;
            stats.def += equip.def;
            stats.foc += equip.foc;
        }

        for(let modifier of MODIFIERS) {
            if(!(modifier in stats.modifiers)) {
                stats.modifiers[modifier] = 0;
            }
            stats.modifiers[modifier] += equip[modifier] ?? 0;
        }
    }

    applyEquipmentSlot("head");
    applyEquipmentSlot("arm-r");
    applyEquipmentSlot("arm-l");
    applyEquipmentSlot("torso");
    applyEquipmentSlot("feet");
}
//#endregion Equipment

//#region Circuits
let circuitPage = "Neutral"
function updateCircuitPage(newPage) {
    document.getElementById(`circuitPage${circuitPage}`).classList.remove("active");
    document.getElementById(`container${circuitPage}Circuit`).classList.remove("active")
    document.getElementById(`circuitPage${newPage}`).classList.add("active");
    document.getElementById(`container${newPage}Circuit`).classList.add("active")
    circuitPage = newPage;
}

for(let element of ["Neutral", "Heat", "Cold", "Shock", "Wave"]) {
    document.getElementById(`circuitPage${element}`).addEventListener("click", () => updateCircuitPage(element))
}

function applyCircuitStats(stats) {
    let statBonuses = {
        atk: 0,
        def: 0,
        foc: 0,

        modifiers: {

        }
    }
    /**
     * @param {HTMLInputElement} box 
     * @param {number} [factor=1] 
     */
    function applyStatValue(box, factor = 1) {
        const valueRegex = /(\S+) (\d+)/

        let result = box.value.match(valueRegex);

        let [statName, statValue] = [result[1], +result[2]];

        statValue *= 0.01 * factor;
        
        if(["atk", "def", "foc"].includes(statName)) {
            statBonuses[statName] += statValue;
        } else {
            if(!(statName in statBonuses.modifiers)) {
                statBonuses.modifiers[statName] = statValue;
            } else {
                statBonuses.modifiers[statName] += statValue;
            }
        }
    }
    /**
     * @param {NodeListOf<HTMLInputElement>} children
     */
    function lookThroughChildren(children, factor = 1) {
        for(let element of children) {
            if(!element.checked) continue;
            applyStatValue(element, factor);
        }
    }
    
    let element = getRadioValue("playerCircuitElement");
    let neutralFactor = 1;
    if(element != "Neutral") {
        lookThroughChildren(document.querySelectorAll(`#container${element}Circuit input`));
        neutralFactor = 0.5;
    }
    lookThroughChildren(document.querySelectorAll(`#containerNeutralCircuit input`), neutralFactor);
    
    stats.atk *= 1 + statBonuses.atk;
    stats.def *= 1 + statBonuses.def;
    stats.foc *= 1 + statBonuses.foc;

    for(let mod in statBonuses.modifiers) {
        if(!(mod in stats.modifiers)) {
            stats.modifiers[mod] = statBonuses.modifiers[mod];
        } else {
            stats.modifiers[mod] += statBonuses.modifiers[mod];
        }
    }
}

//#endregion

//#region Consumables
async function loadConsumables() {
    await fetch("consumables.json").then(res => res.json()).then(data => processConsumables(data))
}

const consumables = [];
/** @type {Set<HTMLButtonElement>} */
const selectedConsumables = new Set();

const consumableContainer = document.querySelector("#consumableSelector > .multiElementContainer");

function processConsumables(data) {
    for(let foodItem of data) {
        let id = consumables.push(foodItem) - 1;

        let button = document.createElement("button");
        button.value = id;
        button.textContent = foodItem.name;
        button.title = foodItem.titleText;
        button.addEventListener("click", toggleConsumable)
        
        consumableContainer.appendChild(button)
    }
}

/** @this HTMLButtonElement */
function toggleConsumable() {
    if(this.classList.contains("active")) {
        this.classList.remove("active");
        selectedConsumables.delete(this);
    } else {
        this.classList.add("active");
        selectedConsumables.add(this);
    }

    checkConsumables();
    document.getElementById("consumableCount").innerText = selectedConsumables.size;
}

function checkConsumables() {
    let buffs = new Set();
    function checkStat(obj, stat) {
        if(obj[stat]) {
            if(buffs.has(stat)) {
                document.getElementById("consumableOverlapWarning").classList.remove("hidden")
                return true;
            }
            buffs.add(stat);
        }
        return false;
    }
    for(let button of selectedConsumables) {
        let statChange = consumables[button.value].statChanges;
        for(let stat of ["atk", "def", "foc"]) {
            if(checkStat(statChange, stat)) return;
        }
        for(let stat of Object.keys(statChange.modifiers)) {
            if(checkStat(statChange.modifiers, stat)) return;
        }
        document.getElementById("consumableOverlapWarning").classList.add("hidden")
    }
}

function clearSelectedConsumables() {
    for(let element of selectedConsumables) {
        element.classList.remove("active");
    }
    selectedConsumables.clear();
    document.getElementById("consumableOverlapWarning").classList.add("hidden")
    document.getElementById("consumableCount").innerText = 0;
}

document.getElementById("resetConsumables").addEventListener("click", clearSelectedConsumables)

function applyConsumables(stats) {
    for(let button of selectedConsumables) {
        let statChange = consumables[button.value].statChanges;

        stats.atk *= statChange.atk || 1;
        stats.def *= statChange.def || 1;
        stats.foc *= statChange.foc || 1;

        for(let [key, val] of Object.entries(statChange.modifiers)) {
            if(key in stats.modifiers) {
                stats.modifiers[key] += val;
            } else {
                stats.modifiers[key] = val;
            }
        }
    }
}

loadConsumables();
//#endregion

function applyPlayerStats() {
    let stats = {
        atk: 0,
        def: 0,
        foc: 0,

        modifiers: {}
    }
    let playerLevel = getNumericValue("playerLevel")
    calcPlayerBaseStats(stats, playerLevel)
    getPlayerEquipmentStats(stats, getCheckboxValue("enableAscendedScaleOverride") ? getNumericValue("gearLevelOverride") : playerLevel);
    applyCircuitStats(stats);
    applyConsumables(stats);

    stats.atk = Math.floor(stats.atk);
    stats.def = Math.floor(stats.def);
    stats.foc = Math.floor(stats.foc);

    setElementValue("playerStat_atk", stats.atk);
    setElementValue("playerStat_def", stats.def);
    setElementValue("playerStat_foc", stats.foc);


    for(let key of MODIFIERS) {
        setElementValue(key, Math.round(stats.modifiers[key] * 100) || 0);
    }
}

document.getElementById("applyPlayerStats").addEventListener("click", () => {
    applyPlayerStats();
    updateAllValues();
    calculateDamage();
})
//#endregion

//#region Enemy Stat Auto-Fill
async function fetchEnemies() {
    await fetch("enemies.json").then(res => res.json()).then(data => loadEnemies(data))
}

let enemies = [];

const areaToName = {
    "arid-dng-1": "Vermillion Dungeon",
    "arid-dng-2": "Vermillion Tower",
    "arid": "Vermillion Wasteland",
    "autumn-area": "Autumn's Rise",
    "autumn-fall": "Autumn's Fall",
    "beach": "Azure Archipelago",
    "bergen-trails": "Bergen Trail",
    "bergen":"Bergen Village",
    "cargo-ship":"Cargo Ship",
    "cold-dng":"Temple Mine",
    "evo-village":"Homestedt",
    "fallback":"Fallback",
    "final-dng":"Ku'lero Temple",
    "forest":"Sapphire Ridge",
    "heat-area":"Maroon Valley",
    "heat-dng":"Faj'ro Temple",
    "heat-village":"Ba'kii Kum",
    "hideout":"Old Hideout",
    "jungle-city":"Basin Keep",
    "jungle":"Gaia's Garden",
    "meta":"Meta",
    "rhombus-dng":"Rhombus Dungeon",
    "rhombus-sqr":"Rhombus Square",
    "rookie-harbor":"Rookie Harbor",
    "shock-dng":"Zir'vitar Temple",
    "testing-grounds":"Testing Ground",
    "tree-dng":"Grand Krys'kajo",
    "wave-dng":"So'najiz Temple",
}

function loadEnemies(data) {
    const selectBox = document.getElementById("enemySelectBox");
    /** @type {HTMLOptGroupElement} */
    const defaultOptGroup = document.querySelector("#enemySelectBox > optgroup[_area='other']")
    
    for(let enemy of data) {
        let id = enemies.push(enemy) - 1;
        let option = document.createElement("option");
        /** @type {HTMLOptGroupElement} */
        let optgroup;
        if(enemy.area) {
            optgroup = document.querySelector(`#enemySelectBox > optgroup[_area=${enemy.area}]`);
            if(!optgroup) {
                optgroup = document.createElement("optgroup");
                optgroup.setAttribute("_area", enemy.area);
                optgroup.label = areaToName[enemy.area] ?? enemy.area;
                selectBox.insertBefore(optgroup, defaultOptGroup);
            }
        } else {
            optgroup = defaultOptGroup;
            optgroup.classList.remove("hidden")
        }
        option.value = id;
        option.innerText = enemy.name;
        optgroup.appendChild(option)
    }
}


/** @this {HTMLSelectElement} */
function selectEnemy() {
    /** @type {HTMLSelectElement} */
    let stateBox = document.getElementById("enemyStateBox");
    stateBox.innerHTML = "";
    
    if(this.value) {
        let enemy = enemies[this.value]
        stateBox.disabled = false;
        let isFirst = true;
        for(let state of Object.keys(enemy.states)) {
            let option = document.createElement("option");
            option.value = state;
            option.innerText = state;
            stateBox.appendChild(option);
            if(isFirst || state == "DEFAULT") {
                stateBox.value = state;
                isFirst = false;
            }
        }
    } else {
        stateBox.disabled = true;
        stateBox.value = "";
    }
}

fetchEnemies();
document.getElementById("enemySelectBox").addEventListener("change", selectEnemy)
document.getElementById("enemyStateBox").disabled = true;
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

//#region Webpage Initialization
for (let element of document.querySelectorAll("input.updateOnChange")) {
    element.addEventListener("change", calculateDamage)
}

document.getElementById("dashCountOut").innerText = getNumericValue("dashCount")

document.getElementById("dashCount").addEventListener("change", () => {
    document.getElementById("dashCountOut").innerText = getNumericValue("dashCount")
})

document.getElementById("partyCountOut").innerText = getNumericValue("partyCount")

let updateParty = () => {
    let count = getNumericValue("partyCount");
    document.getElementById("partyCountOut").innerText = count >= 2 ? "2+" : count; 
};

updateParty();
document.getElementById("partyCount").addEventListener("change", updateParty)

loadEquipment();
calculateDamage();
//#endregion