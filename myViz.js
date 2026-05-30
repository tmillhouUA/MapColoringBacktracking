//Visualization Settings

let width = 1800
let height = 900
let sideSquares = 5
let sideLength = 100
let fps = 30
let squareSize = sideLength/sideSquares
let varOrdering = 'degree' // 'none' | 'degree' | 'mrv'
let filtering = 'none' // 'none' | 'fc' | 'ac3'

//Prepare Data

const allStates = Object.keys(stateNeighbors)
let states = []

function computeStateOrder(){
    if(varOrdering === 'degree'){
        let sorted = []
        for(let i=0; i<allStates.length; i++){
            let state = allStates[i]
            let added = false
            for(let j=0; j<sorted.length; j++){
                if(stateNeighbors[state].length < stateNeighbors[sorted[j]].length){
                    sorted.splice(j, 0, state)
                    added = true
                    break
                }
            }
            if(!added) sorted.push(state)
        }
        sorted.reverse()
        states = sorted
    } else if(varOrdering === 'mrv'){
        // MRV picks dynamically, but seed AZ as the first variable
        let rest = allStates.filter(s => s !== 'AZ')
        states = ['AZ'].concat(rest)
    } else {
        states = allStates.slice()
    }
}

function legalColorCount(state, assignment, domains){
    if(filtering !== 'none' && domains) return domains[state].length
    let neighborColors = stateNeighbors[state]
        .filter(n => assignment[n] !== undefined)
        .map(n => assignment[n])
    return colors.filter((_, i) => !neighborColors.includes(i)).length
}

function pickNextVar(assignment, domains){
    let unassigned = states.filter(s => assignment[s] === undefined)
    if(varOrdering === 'mrv'){
        let best = unassigned[0]
        let bestCount = legalColorCount(best, assignment, domains)
        for(let i=1; i<unassigned.length; i++){
            let count = legalColorCount(unassigned[i], assignment, domains)
            if(count < bestCount){ best = unassigned[i]; bestCount = count }
        }
        return best
    }
    return unassigned[0]
}

//Create SVG

let svg = d3.select('#viz').append('svg')
    .attr("viewBox", "0 0 " + width + " " + height)
    .attr("preserveAspectRatio", "xMidYMid meet")

computeStateOrder()

//Create Visualization Elements

//colors = ["#9fb7ac","#609aa1","#bfbca2","#496464"] //0,1,2,3
//colors = ["#588c7e","#f2e394","#f2ae72","#d96459"] //0,1,2,3
//colors = ["#4a90a4","#c07d3a","#6aab6a","#9b5b9b"] //0,1,2,3 — steel blue, burnt orange, forest green, muted purple
//colors = ["#3d7ebf","#bf7c3d","#5ea65e","#a64f6e"] //0,1,2,3 — cobalt, amber, sage, rose
colors = ["#1a6fcc","#cc5200","#1a8c1a","#8c1a66"] //0,1,2,3 — bold blue, deep orange, strong green, vivid magenta

let key = ""
let mapGroup = svg.append("g")
stateGlyphs = {}
stateColors = {}
for(let i=0; i<states.length;i++){
    key = states[i]
    stateGlyphs[key] = mapGroup.append("path").attr("stroke","white").attr("fill","None").attr("d",stateBorders[key])
}

// Pre-compute center of mass for each state from perimeter points (in SVG coordinate space)
const stateCOM = {}
const comSamples = 64
for(let i=0; i<allStates.length; i++){
    let s = allStates[i]
    let node = stateGlyphs[s].node()
    let len = node.getTotalLength()
    if(len === 0){ stateCOM[s] = {x:0, y:0}; continue }
    let sx = 0, sy = 0
    for(let k=0; k<comSamples; k++){
        let pt = node.getPointAtLength(len * k / comSamples)
        sx += pt.x; sy += pt.y
    }
    stateCOM[s] = {x: sx/comSamples, y: sy/comSamples}
}

// Layout constants
const barWidth = 30
const barGap = 16   // gap between progress bar and map
const panelW = 150
const panelH = 260
const panelGap = -75 // gap between map and stats panel

// Scale map to fit the available width after reserving space for bar and panel
let bb = mapGroup.node().getBBox()
let mapAreaWidth = width - barWidth - barGap - panelGap - panelW
let scale = Math.min(mapAreaWidth / bb.width, height / bb.height) * 0.9
let mapW = bb.width * scale
let mapH = bb.height * scale

// Center the full content block (bar + gap + map + gap + panel) in the viewBox
let contentWidth = barWidth + barGap + mapW + panelGap + panelW
let leftMargin = (width - contentWidth) / 2

let barX = leftMargin
let mapTx = leftMargin + barWidth + barGap - bb.x * scale
let mapTy = (height - mapH) / 2 - bb.y * scale
mapGroup.attr("transform", "translate(" + mapTx + "," + mapTy + ") scale(" + scale + ")")

barHeight = mapH
let barY = (height - barHeight) / 2
let progressBar = svg.append("rect").attr("x", barX).attr("y", barY).attr("width", barWidth).attr("height", 0).attr("fill","#1a6fcc").attr("stroke","None").attr("stroke-width",2).attr("rx",6)
let progressFrame = svg.append("rect").attr("x", barX).attr("y", barY).attr("width", barWidth).attr("height", barHeight).attr("fill","None").attr("stroke","white").attr("stroke-width",2).attr("rx",6)

// Stats panel — right of map, bottom-aligned with progress bar
const panelX = leftMargin + barWidth + barGap + mapW + panelGap
const panelY = barY + barHeight - panelH
let statsPanel = svg.append("rect")
    .attr("x", panelX).attr("y", panelY)
    .attr("width", panelW).attr("height", panelH)
    .attr("fill", "#3d3d3d").attr("stroke", "white").attr("stroke-width", 1).attr("rx", 5)

// Stats panel text
const panelPad = 16
const labelX = panelX + panelPad

function makeStatRow(y, label){
    svg.append("text")
        .attr("x", labelX).attr("y", y)
        .attr("fill", "#aaa").attr("font-size", 12).attr("font-family", "sans-serif")
        .text(label)
    return svg.append("text")
        .attr("x", labelX).attr("y", y + 20)
        .attr("fill", "white").attr("font-size", 18).attr("font-family", "sans-serif")
        .text("0")
}

const statY0 = panelY + panelPad + 13
const lineH = 38
let statCurrent      = makeStatRow(statY0,           "Current Variable").text("-")
let statAssigned     = makeStatRow(statY0 + lineH,   "Assigned")
let statNodes        = makeStatRow(statY0 + lineH*2, "Nodes Explored")
let statBacktracks   = makeStatRow(statY0 + lineH*3, "Backtracks")
let statFailed       = makeStatRow(statY0 + lineH*4, "Failed Assignments")
let statFrontier     = makeStatRow(statY0 + lineH*5, "Max Frontier Size")

let nodesExplored = 0
let backtracks = 0
let failedAssignments = 0
let prevAssignedCount = 0
let maxFrontier = 0

function updateStats(assignment, currentVar){
    if(frontier.length > maxFrontier) maxFrontier = frontier.length
    let assignedCount = Object.keys(assignment).length
    statCurrent.text(currentVar || "-")
    statAssigned.text(assignedCount + " / " + states.length)
    statNodes.text(nodesExplored)
    statBacktracks.text(backtracks)
    statFailed.text(failedAssignments)
    statFrontier.text(maxFrontier)
}

const bgColor = "#2b2b2b"

function drawMap(assignment, currentVar, highlightFill){
    let keys = Object.keys(assignment)
    progress = barHeight * keys.length/states.length
    progressBar.attr("height",progress)
    for(let i=0; i<states.length;i++){
        let s = states[i]
        let glyph = stateGlyphs[s]
        if(s === currentVar){
            let c = stateCOM[s]
            let fill = highlightFill !== undefined ? highlightFill : bgColor
            glyph.attr("fill", fill).attr("stroke","white").attr("stroke-width",1.5)
            glyph.transition().duration(50)
                 .attr("transform", "translate("+c.x+","+c.y+") scale(1.1) translate("+-c.x+","+-c.y+")")
        } else if(keys.includes(s)){
            glyph.attr("fill",colors[assignment[s]]).attr("stroke","white").attr("stroke-width",1)
            glyph.transition().duration(16).attr("transform",null)
        } else {
            glyph.attr("fill","None").attr("stroke","white").attr("stroke-width",1)
            glyph.transition().duration(16).attr("transform",null)
        }
    }
    // Re-append highlighted state to end of group so it paints on top
    if(currentVar) mapGroup.node().appendChild(stateGlyphs[currentVar].node())
}

function checkConstraints(state){
    let assigned = Object.keys(state)    
    for(let i=0; i<assigned.length;i++){
        let neighbors = stateNeighbors[assigned[i]]   
        //console.log(assigned[i])           
        for(let j=0; j<neighbors.length;j++){
            if(assigned.includes(neighbors[j])){                
                if(state[assigned[i]]==state[neighbors[j]]){
                    return false
                }
            }
        }
    }
    return true
}

// FC / AC-3: a node is {assignment, domains}
function makeInitialNode(){
    let allColors = colors.map((_,i) => i)
    let domains = {}
    allStates.forEach(s => domains[s] = allColors.slice())
    return {assignment: {}, domains: domains}
}

// FC: assign nextVar=colorIdx, prune immediate neighbors, return null if any domain empties.
function fcAssign(node, nextVar, colorIdx){
    let newAssign = JSON.parse(JSON.stringify(node.assignment))
    let newDomains = JSON.parse(JSON.stringify(node.domains))
    newAssign[nextVar] = colorIdx
    delete newDomains[nextVar]
    for(let n of stateNeighbors[nextVar]){
        if(newAssign[n] !== undefined) continue
        newDomains[n] = newDomains[n].filter(c => c !== colorIdx)
        if(newDomains[n].length === 0) return null
    }
    return {assignment: newAssign, domains: newDomains}
}

// AC-3: propagate arc consistency across the whole graph.
// Returns false if any domain empties, otherwise mutates domains in place.
function ac3(assignment, domains){
    let queue = []
    for(let s of allStates){
        if(assignment[s] !== undefined) continue
        for(let n of stateNeighbors[s]){
            if(assignment[n] !== undefined) continue
            queue.push([s, n])
        }
    }
    while(queue.length > 0){
        let [xi, xj] = queue.shift()
        if(revise(assignment, domains, xi, xj)){
            if(domains[xi].length === 0) return false
            for(let xk of stateNeighbors[xi]){
                if(xk !== xj && assignment[xk] === undefined) queue.push([xk, xi])
            }
        }
    }
    return true
}

// Remove values from domains[xi] that have no support in domains[xj].
function revise(assignment, domains, xi, xj){
    let revised = false
    domains[xi] = domains[xi].filter(cx => {
        let hasSupport = domains[xj].some(cy => cy !== cx)
        if(!hasSupport){ revised = true; return false }
        return true
    })
    return revised
}

// AC-3: assign nextVar=colorIdx, then propagate full arc consistency.
function ac3Assign(node, nextVar, colorIdx){
    let newAssign = JSON.parse(JSON.stringify(node.assignment))
    let newDomains = JSON.parse(JSON.stringify(node.domains))
    newAssign[nextVar] = colorIdx
    delete newDomains[nextVar]
    // First do FC pruning on neighbors
    for(let n of stateNeighbors[nextVar]){
        if(newAssign[n] !== undefined) continue
        newDomains[n] = newDomains[n].filter(c => c !== colorIdx)
        if(newDomains[n].length === 0) return null
    }
    // Then propagate full AC-3
    if(!ac3(newAssign, newDomains)) return null
    return {assignment: newAssign, domains: newDomains}
}

let frontier = [JSON.parse(JSON.stringify(stateColors))]
let done = false
let highlightedVar = null    // state currently shown highlighted
let highlightedAssign = null // assignment snapshot when highlight started
let highlightedColor = null  // first valid color index for the highlighted state
let highlightFrame = 0       // 1 = bg fill, 2 = assigned fill

function backTrack(){
    if(frontier.length>0 && !done){
        // Frame 2: show highlighted state with its assigned color
        if(highlightFrame === 1){
            drawMap(highlightedAssign, highlightedVar, colors[highlightedColor])
            highlightFrame = 2
            return
        }
        // Frame 3: restore normal size with assigned color, advance
        if(highlightFrame === 2){
            let withAssigned = JSON.parse(JSON.stringify(highlightedAssign))
            withAssigned[highlightedVar] = highlightedColor
            drawMap(withAssigned)
            highlightedVar = null
            highlightedAssign = null
            highlightedColor = null
            highlightFrame = 0
            return
        }

        let open = frontier.pop()
        nodesExplored++
        let assignment = filtering !== 'none' ? open.assignment : open
        let domains = filtering !== 'none' ? open.domains : null
        let assigned = Object.keys(assignment)
        if(assigned.length < prevAssignedCount) backtracks++
        prevAssignedCount = assigned.length
        if(assigned.length==states.length){
            drawMap(assignment)
            updateStats(assignment, null)
            console.log(assignment)
            done = true
            playing = false
            document.getElementById('playPauseBtn').textContent = 'Play'
        }else{
            let nextVar = pickNextVar(assignment, domains)
            let firstColor = null
            let colorList = filtering !== 'none' ? domains[nextVar] : colors.map((_,i)=>i)
            for(let i=0; i<colorList.length; i++){
                let colorIdx = colorList[i]
                if(filtering === 'fc'){
                    let child = fcAssign(open, nextVar, colorIdx)
                    if(child !== null){
                        frontier.push(child)
                        if(firstColor === null) firstColor = colorIdx
                    } else { failedAssignments++ }
                } else if(filtering === 'ac3'){
                    let child = ac3Assign(open, nextVar, colorIdx)
                    if(child !== null){
                        frontier.push(child)
                        if(firstColor === null) firstColor = colorIdx
                    } else { failedAssignments++ }
                } else {
                    let nextChild = JSON.parse(JSON.stringify(assignment))
                    nextChild[nextVar] = colorIdx
                    if(checkConstraints(nextChild)){
                        frontier.push(nextChild)
                        if(firstColor === null) firstColor = colorIdx
                    } else { failedAssignments++ }
                }
            }
            // Frame 1: enlarged, background fill
            drawMap(assignment, nextVar)
            updateStats(assignment, nextVar)
            highlightedVar = nextVar
            highlightedAssign = assignment
            highlightedColor = firstColor
            highlightFrame = 1
        }
    }
}

let playing = false
let animation = null

function startAnimation(){
    animation = setInterval(backTrack, 1000/fps)
}

function stopAnimation(){
    clearInterval(animation)
    animation = null
}

function reset(){
    stopAnimation()
    computeStateOrder()
    frontier = filtering !== 'none' ? [makeInitialNode()] : [{}]
    done = false
    highlightedVar = null
    highlightedAssign = null
    highlightedColor = null
    highlightFrame = 0
    nodesExplored = 0
    backtracks = 0
    failedAssignments = 0
    prevAssignedCount = 0
    maxFrontier = 0
    playing = false
    document.getElementById('playPauseBtn').textContent = 'Play'
    drawMap({})
    updateStats({}, null)
}

document.getElementById('playPauseBtn').addEventListener('click', function(){
    if(done){
        reset()
        startAnimation()
        playing = true
        this.textContent = 'Pause'
    } else if(playing){
        stopAnimation()
        playing = false
        this.textContent = 'Play'
    } else {
        startAnimation()
        playing = true
        this.textContent = 'Pause'
    }
})

document.getElementById('stepBtn').addEventListener('click', function(){
    if(playing){
        stopAnimation()
        playing = false
        document.getElementById('playPauseBtn').textContent = 'Play'
    }
    {
        backTrack() // frame 1: enlarge + bg fill
        setTimeout(function(){
            backTrack() // frame 2: assigned fill
            setTimeout(function(){
                backTrack() // frame 3: shrink back
            }, 1000/fps)
        }, 1000/fps)
    }
})

document.getElementById('resetBtn').addEventListener('click', reset)

document.querySelectorAll('input[name="varOrder"]').forEach(function(radio){
    radio.addEventListener('change', function(){
        varOrdering = this.value
        reset()
    })
})

document.querySelectorAll('input[name="filtering"]').forEach(function(radio){
    radio.addEventListener('change', function(){
        filtering = this.value
        reset()
    })
})

document.getElementById('playPauseBtn').textContent = 'Play'

const slider = document.getElementById('speedSlider')
const speedDisplay = document.getElementById('speedDisplay')
slider.addEventListener('input', function(){
    fps = parseInt(this.value)
    speedDisplay.textContent = fps + ' fps'
    if(playing){
        stopAnimation()
        startAnimation()
    }
})
